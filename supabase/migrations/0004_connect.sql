-- ============================================================================
-- Slice C — connect & trust: reports/moderation and listing view tracking.
-- (enquiries, chats, messages, visits, property_ratings already exist in 0001.)
-- ============================================================================

-- ---------- Reports / moderation queue --------------------------------------
create type report_subject as enum ('listing', 'user', 'message');
create type report_status  as enum ('open', 'reviewing', 'actioned', 'dismissed');

create table reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references users (id) on delete cascade,
  subject_type report_subject not null,
  subject_id   text not null,
  reason       text not null,
  detail       text,
  status       report_status not null default 'open',
  created_at   timestamptz not null default now()
);
create index idx_reports_status on reports (status, created_at);

alter table reports enable row level security;

-- Anyone signed in can file a report about themselves as the reporter.
create policy reports_insert on reports for insert
  with check (reporter_id = auth.uid());
create policy reports_read on reports for select
  using (reporter_id = auth.uid() or is_admin());
create policy reports_admin on reports for update
  using (is_admin()) with check (is_admin());

-- ---------- Listing view tracking (feeds the owner dashboard) ---------------
alter table listings add column view_count integer not null default 0;

-- Atomic, security-definer increment so anonymous viewers can bump the
-- counter for an active listing without broad UPDATE rights.
create or replace function increment_listing_view(p_listing uuid)
returns void language sql security definer set search_path = public as $$
  update listings set view_count = view_count + 1
  where id = p_listing and status = 'active';
$$;

-- ---------- Realtime ---------------------------------------------------------
-- Stream new chat messages to participants (RLS still applies to the stream).
alter publication supabase_realtime add table messages;
