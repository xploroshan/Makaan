-- ============================================================================
-- Applications & Offers — the step that actually closes a rent/lease/buy deal.
-- A seeker applies / makes an offer with terms; the owner reviews, accepts or
-- declines, and finalises (which records the deal and flips the listing to
-- rented/sold). Payment execution, e-agreements and KYC are partner-dependent
-- and layer on top of this record later.
-- ============================================================================

create type offer_status as enum (
  'submitted', 'accepted', 'declined', 'withdrawn', 'completed'
);

create table offers (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings (id) on delete cascade,
  applicant_id    uuid not null references users (id) on delete cascade,
  offer_price     numeric(14,2) not null,
  deposit         numeric(14,2),
  move_in         date,
  duration_months int,
  message         text,
  status          offer_status not null default 'submitted',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (listing_id, applicant_id)
);
create index idx_offers_listing   on offers (listing_id);
create index idx_offers_applicant on offers (applicant_id);
create trigger trg_offers_updated before update on offers
  for each row execute function set_updated_at();

alter table offers enable row level security;

-- The applicant and the listing owner (and admins) can see an offer.
create policy offers_party_read on offers for select using (
  applicant_id = auth.uid() or is_admin()
  or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
);
-- Only the applicant creates their own offer.
create policy offers_applicant_insert on offers for insert
  with check (applicant_id = auth.uid());
-- Applicant (withdraw) or owner (accept/decline/complete) may update; the exact
-- transition rules are enforced in the service layer.
create policy offers_party_update on offers for update using (
  applicant_id = auth.uid() or is_admin()
  or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
) with check (
  applicant_id = auth.uid() or is_admin()
  or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
);
