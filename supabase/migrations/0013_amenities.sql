-- ============================================================================
-- First-class amenities on listings (wifi, AC, parking, food, housekeeping…),
-- the headline feature of co-living players like Zolo & Nestaway. Stored as a
-- text[] with a GIN index so search can filter by "must have these amenities".
-- ============================================================================

alter table listings
  add column if not exists amenities text[] not null default '{}';

create index if not exists idx_listings_amenities
  on listings using gin (amenities);
