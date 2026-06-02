-- ============================================================================
-- Slice B — profiles: agent reviews (+ rating aggregation) and a guard that
-- prevents users from self-assigning the admin role via the self-update policy.
-- ============================================================================

-- ---------- Agent / broker reviews ------------------------------------------
create table agent_reviews (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references agent_profiles (id) on delete cascade,
  reviewer_id uuid not null references users (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  text        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (agent_id, reviewer_id)
);
create index idx_agent_reviews_agent on agent_reviews (agent_id);
create trigger trg_agent_reviews_updated before update on agent_reviews
  for each row execute function set_updated_at();

-- Keep agent_profiles.rating_avg / rating_count in sync.
create or replace function recompute_agent_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid := coalesce(new.agent_id, old.agent_id);
begin
  update agent_profiles ap
  set rating_avg = coalesce((
        select round(avg(r.rating)::numeric, 1) from agent_reviews r
        where r.agent_id = target), 0),
      rating_count = (
        select count(*) from agent_reviews r where r.agent_id = target)
  where ap.id = target;
  return null;
end;
$$;
create trigger trg_agent_reviews_aggregate
  after insert or update or delete on agent_reviews
  for each row execute function recompute_agent_rating();

alter table agent_reviews enable row level security;

create policy agent_reviews_public_read on agent_reviews for select using (true);

-- A reviewer may rate an agent once, and never themselves.
create policy agent_reviews_insert on agent_reviews for insert with check (
  reviewer_id = auth.uid()
  and not exists (
    select 1 from agent_profiles ap
    where ap.id = agent_id and ap.user_id = auth.uid()
  )
);
create policy agent_reviews_modify on agent_reviews for update
  using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());
create policy agent_reviews_delete on agent_reviews for delete
  using (reviewer_id = auth.uid() or is_admin());

-- ---------- Privilege-escalation guard --------------------------------------
-- The users self-update policy lets a user edit their own row; this trigger
-- ensures they cannot grant themselves the admin role. Self-service roles
-- (seeker/owner/agent) remain freely addable.
create or replace function prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Only an authenticated, non-admin user is blocked from gaining admin.
  -- The trusted backend (service role; auth.uid() is null) and admins may.
  if auth.uid() is not null and not is_admin() then
    if ('admin' = any (new.roles)) and not ('admin' = any (old.roles)) then
      raise exception 'cannot self-assign admin role';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_prevent_role_escalation
  before update of roles on users
  for each row execute function prevent_role_escalation();
