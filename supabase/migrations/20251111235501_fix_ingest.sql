BEGIN;

create or replace function public.ingest_spotify_plays(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1) ARTISTS: one row per id; prefer non-null href/uri/name
  insert into public.artists as ar (id, name, href, uri)
  select distinct on (aj->>'id')
    aj->>'id',
    aj->>'name',
    aj->>'href',
    aj->>'uri'
  from jsonb_array_elements(p_items) t
  cross join lateral jsonb_array_elements(t->'track'->'artists') aj
  where aj ? 'id'
  order by
    (aj->>'id'),
    (aj->>'href') is null,   -- false < true → non-null first
    (aj->>'uri')  is null,
    (aj->>'name') is null
  on conflict (id) do update
  set
    name       = excluded.name,
    href       = excluded.href,
    uri        = excluded.uri,
    updated_at = now()
  where
    (ar.name is distinct from excluded.name)
    or (ar.href is distinct from excluded.href)
    or (ar.uri  is distinct from excluded.uri);

  -- 2) TRACKS: one row per id; prefer non-null fields
  insert into public.tracks as tr (id, name, artist_id, duration_ms, explicit, href, uri)
  select distinct on (t->'track'->>'id')
    t->'track'->>'id',
    t->'track'->>'name',
    t->'track'->'artists'->0->>'id',
    coalesce((t->'track'->>'duration_ms')::int, 0),
    coalesce((t->'track'->>'explicit')::boolean, false),
    t->'track'->>'href',
    t->'track'->>'uri'
  from jsonb_array_elements(p_items) t
  where t->'track' ? 'id'
  order by
    (t->'track'->>'id'),
    (t->'track'->>'href')       is null,
    (t->'track'->>'uri')        is null,
    (t->'track'->>'duration_ms') is null
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
    (tr.name        is distinct from excluded.name)
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

COMMIT;