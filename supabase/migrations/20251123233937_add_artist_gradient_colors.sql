BEGIN;

-- Add cached gradient colors for artist primary images
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS gradient_start text,
  ADD COLUMN IF NOT EXISTS gradient_end text;

-- Update hydrate_artists RPC to accept optional gradient colors
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
      x->>'uri'  as uri,
      x->>'gradient_start' as gradient_start,
      x->>'gradient_end' as gradient_end
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
      gradient_start     = coalesce(i.gradient_start, a.gradient_start),
      gradient_end       = coalesce(i.gradient_end, a.gradient_end),
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
        or a.gradient_start is distinct from i.gradient_start
        or a.gradient_end   is distinct from i.gradient_end
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

COMMIT;
