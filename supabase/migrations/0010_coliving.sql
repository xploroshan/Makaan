-- ============================================================================
-- Phase 3 — Co-living operator tools (occupancy management). PRD §5 (co-living).
-- A co-living / PG listing is a property with multiple rooms, each holding one
-- or more beds. Operators track total vs occupied beds to manage occupancy.
-- Rooms are operator-internal: readable/writable only by the listing owner
-- (or an admin), never public.
-- ============================================================================

create table coliving_rooms (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references listings (id) on delete cascade,
  name          text not null,
  room_type     text not null default 'single'
                  check (room_type in ('single', 'double', 'triple', 'dormitory')),
  total_beds    smallint not null default 1 check (total_beds between 1 and 50),
  occupied_beds smallint not null default 0 check (occupied_beds >= 0),
  rent          numeric(12,2),               -- monthly rent per bed
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (occupied_beds <= total_beds)
);
create index idx_coliving_rooms_listing on coliving_rooms (listing_id);
create trigger trg_coliving_rooms_updated before update on coliving_rooms
  for each row execute function set_updated_at();

alter table coliving_rooms enable row level security;

-- Owner-managed: only the listing's owner (or an admin) may read or write its
-- rooms. Occupancy data is operational, not part of the public listing.
create policy coliving_rooms_owner_all on coliving_rooms for all
  using (exists (
    select 1 from listings l
    where l.id = listing_id and (l.owner_id = auth.uid() or is_admin())
  ))
  with check (exists (
    select 1 from listings l
    where l.id = listing_id and (l.owner_id = auth.uid() or is_admin())
  ));
