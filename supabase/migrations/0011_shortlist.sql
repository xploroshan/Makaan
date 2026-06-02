-- ============================================================================
-- Saved homes (shortlist). Every seeker's most-used feature: a personal,
-- private collection of listings. Owner-only RLS — nobody else can see what
-- you've saved.
-- ============================================================================

create table shortlists (
  user_id    uuid not null references users (id) on delete cascade,
  listing_id uuid not null references listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index idx_shortlists_user on shortlists (user_id, created_at desc);

alter table shortlists enable row level security;

create policy shortlists_self_all on shortlists for all
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid());
