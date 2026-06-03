-- ============================================================================
-- Flatmate finder. Seekers publish a flatmate post — either "I have a place,
-- want a flatmate" or "I need a place & people to share with" — and discover
-- compatible people. Compatibility is computed in the app from each author's
-- lifestyle profile, our existing differentiator.
-- ============================================================================

create type flatmate_kind      as enum ('has_place', 'needs_place');
create type flatmate_occupancy as enum ('private', 'shared');

create table flatmate_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references users (id) on delete cascade,
  kind        flatmate_kind not null,
  city        text not null,
  locality    text,
  budget_min  numeric(12,2),
  budget_max  numeric(12,2),
  move_in     date,
  gender_pref text not null default 'any'
                check (gender_pref in ('any', 'male', 'female')),
  occupancy   flatmate_occupancy not null default 'shared',
  headline    text not null,
  description text,
  status      text not null default 'active'
                check (status in ('active', 'closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_flatmate_posts_city   on flatmate_posts (city);
create index idx_flatmate_posts_active on flatmate_posts (status, created_at desc);
create index idx_flatmate_posts_author on flatmate_posts (author_id);
create trigger trg_flatmate_posts_updated before update on flatmate_posts
  for each row execute function set_updated_at();

alter table flatmate_posts enable row level security;

-- Active posts are public; authors (and admins) see and manage their own.
create policy flatmate_public_read on flatmate_posts for select
  using (status = 'active' or author_id = auth.uid() or is_admin());
create policy flatmate_author_write on flatmate_posts for all
  using (author_id = auth.uid() or is_admin())
  with check (author_id = auth.uid());
