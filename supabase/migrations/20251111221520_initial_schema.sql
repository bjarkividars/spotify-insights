BEGIN;

-- =========================
-- CORE TABLES
-- =========================

create table if not exists public.artists (
  id text primary key,                          -- spotify artist id
  name text not null,
  href text,                                    -- API href (optional)
  uri text,                                     -- spotify:artist:...
  -- cached primary image for quick reads (optional, filled by hydrator)
  primary_image_url text,
  primary_image_w   int,
  primary_image_h   int,
  -- lazy hydration status
  details_status text
    check (details_status in ('partial','full'))
    default 'partial',
  details_fetched_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.artist_images (
  artist_id text not null references public.artists(id) on delete cascade,
  ord smallint not null,                        -- 0,1,2 per Spotify array order
  url text not null,
  width int,
  height int,
  primary key (artist_id, ord)
);

create index if not exists idx_artist_images_artist on public.artist_images (artist_id);

create table if not exists public.tracks (
  id text primary key,                          -- spotify track id
  name text not null,
  artist_id text not null references public.artists(id) on delete cascade, -- primary artist
  album_id text,                                -- optional for future
  duration_ms int not null,
  explicit boolean,
  href text,
  uri text,
  updated_at timestamptz default now()
);

create table if not exists public.plays (
  user_id uuid not null references auth.users(id) on delete cascade,
  played_at timestamptz not null,
  track_id text not null references public.tracks(id) on delete restrict,
  context jsonb,
  primary key (user_id, played_at)
);

-- Helpful indexes
create index if not exists idx_plays_user_time     on public.plays (user_id, played_at desc);
create index if not exists idx_tracks_artist       on public.tracks (artist_id);
create index if not exists idx_artists_details     on public.artists (details_status);

-- =========================
-- ROW LEVEL SECURITY
-- =========================

alter table public.plays   enable row level security;
alter table public.artists enable row level security;
alter table public.tracks  enable row level security;
alter table public.artist_images enable row level security;

-- plays: each user can read/insert only their rows
create policy "read own plays" on public.plays
  for select using (auth.uid() = user_id);
create policy "insert own plays" on public.plays
  for insert with check (auth.uid() = user_id);

-- metadata tables: readable by anyone (writes only via service-role RPCs)
create policy "read artists"       on public.artists       for select using (true);
create policy "read tracks"        on public.tracks        for select using (true);
create policy "read artist images" on public.artist_images for select using (true);

-- =========================
-- RPC: ATOMIC INGEST (artists + tracks upsert, plays insert)
-- Input: JSONB array of play items, e.g.:
-- [
--   {
--     "user_id":"<uuid>",
--     "played_at":"<iso>",
--     "track":{
--       "id":"...", "name":"...", "duration_ms":123000, "explicit":true/false,
--       "artists":[{"id":"...","name":"...","href":"...","uri":"..."}, ...],
--       "href":"...", "uri":"..."
--     },
--     "context": {...}
--   }, ...
-- ]
-- =========================

create or replace function public.ingest_spotify_plays(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1) ARTISTS: minimal upsert; keep status 'partial' until hydrated
  insert into public.artists as a (id, name, href, uri)
  select distinct
    a->>'id',
    a->>'name',
    a->>'href',
    a->>'uri'
  from jsonb_array_elements(p_items) t
  cross join lateral jsonb_array_elements(t->'track'->'artists') a
  where a ? 'id'
  on conflict (id) do update
  set
    name       = excluded.name,
    href       = excluded.href,
    uri        = excluded.uri,
    updated_at = now()
  where
    (a.name is distinct from excluded.name)
    or (a.href is distinct from excluded.href)
    or (a.uri  is distinct from excluded.uri);

  -- 2) TRACKS: primary artist = artists[0]
  insert into public.tracks as tr (id, name, artist_id, duration_ms, explicit, href, uri)
  select
    t->'track'->>'id',
    t->'track'->>'name',
    t->'track'->'artists'->0->>'id',
    coalesce((t->'track'->>'duration_ms')::int, 0),
    coalesce((t->'track'->>'explicit')::boolean, false),
    t->'track'->>'href',
    t->'track'->>'uri'
  from jsonb_array_elements(p_items) t
  where t->'track' ? 'id'
  on conflict (id) do update
  set
    name        = excluded.name,
    artist_id   = excluded.artist_id,
    duration_ms = excluded.duration_ms,
    explicit    = excluded.explicit,
    href        = excluded.href,
    uri         = excluded.uri,
    updated_at  = now()
  where
    (tr.name         is distinct from excluded.name)
    or (tr.artist_id   is distinct from excluded.artist_id)
    or (tr.duration_ms is distinct from excluded.duration_ms)
    or (tr.explicit    is distinct from excluded.explicit)
    or (tr.href        is distinct from excluded.href)
    or (tr.uri         is distinct from excluded.uri);

  -- 3) PLAYS: idempotent insert
  insert into public.plays (user_id, played_at, track_id, context)
  select
    (t->>'user_id')::uuid,
    (t->>'played_at')::timestamptz,
    t->'track'->>'id',
    t->'context'
  from jsonb_array_elements(p_items) t
  where t->'track' ? 'id'
  on conflict (user_id, played_at) do nothing;
end
$$;

revoke all on function public.ingest_spotify_plays(jsonb) from public;
grant execute on function public.ingest_spotify_plays(jsonb) to service_role;

-- =========================
-- RPC: HYDRATE ARTISTS (images + mark 'full')
-- Input: JSONB array of updates:
-- [
--   {
--     "id":"<artist_id>",
--     "href":"optional",
--     "uri":"optional",
--     "images":[
--       {"url":"...", "width":640, "height":640},
--       {"url":"...", "width":300, "height":300},
--       {"url":"...", "width":64,  "height":64 }
--     ]
--   }, ...
-- ]
-- Behavior:
--   * Updates artist href/uri if provided
--   * Replaces existing artist_images for those artists
--   * Sets primary_image_* from the largest image (by width)
--   * Marks details_status='full' and stamps details_fetched_at
-- =========================

create or replace function public.hydrate_artists(p_updates jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n_updated int;
begin
  -- Incoming artists to update
  with incoming as (
    select
      x->>'id' as id,
      coalesce(x->'images','[]'::jsonb) as images,
      x->>'href' as href,
      x->>'uri'  as uri
    from jsonb_array_elements(p_updates) x
    where x ? 'id'
  ),
  expanded as (
    -- Expand images with ordinal to preserve order
    select
      i.id as artist_id,
      (img->>'url')::text as url,
      (img->>'width')::int as width,
      (img->>'height')::int as height,
      ord::smallint as ord
    from incoming i
    cross join lateral jsonb_array_elements(i.images) with ordinality as img(img, ord)
    where i.images <> '[]'::jsonb
  ),
  affected as (
    select distinct artist_id from expanded
  ),
  _delete as (
    -- Replace images for affected artists
    delete from public.artist_images ai
    using affected a
    where ai.artist_id = a.artist_id
    returning 1
  ),
  _insert as (
    insert into public.artist_images (artist_id, ord, url, width, height)
    select artist_id, ord, url, width, height
    from expanded
    on conflict (artist_id, ord) do update
      set url = excluded.url,
          width = excluded.width,
          height = excluded.height
    returning 1
  ),
  primaries as (
    -- Choose the "primary" as the largest width image per artist
    select distinct on (e.artist_id)
      e.artist_id,
      e.url,
      e.width,
      e.height
    from expanded e
    order by e.artist_id, e.width desc nulls last, e.height desc nulls last
  ),
  upd_artists as (
    update public.artists a
    set
      href               = coalesce(i.href, a.href),
      uri                = coalesce(i.uri,  a.uri),
      primary_image_url  = p.url,
      primary_image_w    = p.width,
      primary_image_h    = p.height,
      details_status     = 'full',
      details_fetched_at = now(),
      updated_at         = now()
    from incoming i
    left join primaries p on p.artist_id = i.id
    where a.id = i.id
      and (
        a.href is distinct from i.href
        or a.uri  is distinct from i.uri
        or a.primary_image_url is distinct from p.url
        or a.primary_image_w   is distinct from p.width
        or a.primary_image_h   is distinct from p.height
        or a.details_status is distinct from 'full'
      )
    returning 1
  )
  select coalesce((select count(*) from upd_artists),0) into n_updated;

  return n_updated;
end
$$;

revoke all on function public.hydrate_artists(jsonb) from public;
grant execute on function public.hydrate_artists(jsonb) to service_role;

commit;