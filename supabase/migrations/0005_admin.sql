-- ============================================================================
-- Slice D — Super Admin: a featured flag for listing promotion/moderation.
-- (RBAC, dynamic config, form templates, geo, audit_log already exist.)
-- ============================================================================
alter table listings add column featured boolean not null default false;
create index idx_listings_featured on listings (featured) where featured;
