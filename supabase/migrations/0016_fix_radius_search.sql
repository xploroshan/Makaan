-- ============================================================================
-- Fix: geo radius search returned every active listing regardless of distance.
-- The function params lng/lat collided with locations.lng / locations.lat, so
-- st_makepoint(lng, lat) used each row's own coordinates (distance 0 → always
-- within radius). Qualify the params with the function name to disambiguate.
-- Parameter names are kept (lng, lat, radius_m) so the /rpc named-arg call from
-- the search service is unchanged.
-- ============================================================================

create or replace function listings_within_radius(
  lng double precision,
  lat double precision,
  radius_m double precision
)
returns setof listings language sql stable
set search_path = public as $$
  select l.* from listings l
  join locations loc on loc.listing_id = l.id
  where l.status = 'active'
    and loc.geom is not null
    and st_dwithin(
      loc.geom,
      st_setsrid(
        st_makepoint(listings_within_radius.lng, listings_within_radius.lat),
        4326
      )::geography,
      listings_within_radius.radius_m
    );
$$;
