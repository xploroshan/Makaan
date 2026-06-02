-- ============================================================================
-- Phase 2 — Two-way reviews (seeker ↔ owner). PRD §5.8.
-- A user may review another user only after a real interaction between them
-- (an accepted enquiry or a completed visit), preventing fake reviews.
-- ============================================================================

-- True if two users have genuinely interacted (either direction).
create or replace function users_have_interacted(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from enquiries e
    join listings l on l.id = e.listing_id
    where e.status = 'accepted'
      and ((l.owner_id = a and e.seeker_id = b)
        or (l.owner_id = b and e.seeker_id = a))
  ) or exists (
    select 1 from visits v
    join listings l on l.id = v.listing_id
    where v.status = 'completed'
      and ((l.owner_id = a and v.seeker_id = b)
        or (l.owner_id = b and v.seeker_id = a))
  );
$$;

create table user_reviews (
  id          uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references users (id) on delete cascade,
  subject_id  uuid not null references users (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  text        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (reviewer_id, subject_id),
  check (reviewer_id <> subject_id)
);
create index idx_user_reviews_subject on user_reviews (subject_id);
create trigger trg_user_reviews_updated before update on user_reviews
  for each row execute function set_updated_at();

alter table user_reviews enable row level security;

create policy user_reviews_public_read on user_reviews for select using (true);

-- Insert only about someone you've actually interacted with, never yourself.
create policy user_reviews_insert on user_reviews for insert with check (
  reviewer_id = auth.uid()
  and subject_id <> auth.uid()
  and users_have_interacted(auth.uid(), subject_id)
);
create policy user_reviews_modify on user_reviews for update
  using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());
create policy user_reviews_delete on user_reviews for delete
  using (reviewer_id = auth.uid() or is_admin());
