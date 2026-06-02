-- ============================================================================
-- Phase 2 — Saved searches & alerts.
-- saved_searches already exists (0001); add a watermark + an in-app
-- notifications inbox. Alert delivery to email/WhatsApp is a later add-on;
-- in-app notifications work with no third-party provider.
-- ============================================================================

alter table saved_searches
  add column last_notified_at timestamptz not null default now();

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  type       text not null default 'info',
  title      text not null,
  body       text,
  url        text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications (user_id, read_at, created_at desc);

alter table notifications enable row level security;

create policy notifications_self_select on notifications for select
  using (user_id = auth.uid());
create policy notifications_self_insert on notifications for insert
  with check (user_id = auth.uid());
create policy notifications_self_update on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_self_delete on notifications for delete
  using (user_id = auth.uid());

-- Live bell updates for the signed-in user (RLS still applies to the stream).
alter publication supabase_realtime add table notifications;
