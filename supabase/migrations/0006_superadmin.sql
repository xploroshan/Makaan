-- ============================================================================
-- Bootstrap super admin.
-- Grants the `admin` role to the founder account (roshan.manuel@gmail.com):
--   1) immediately, if the user row already exists, and
--   2) automatically on first sign-in (the public.users row is created by the
--      handle_new_user trigger, then promoted here).
-- Idempotent and safe to re-run. To change/remove the super admin later, edit
-- this email or revoke via the admin console / a follow-up migration.
-- ============================================================================

-- Auto-promote on insert (fires after handle_new_user creates the row).
create or replace function bootstrap_superadmin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email = 'roshan.manuel@gmail.com'
     and not ('admin' = any (new.roles)) then
    new.roles := array_append(new.roles, 'admin'::user_role);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bootstrap_superadmin on users;
create trigger trg_bootstrap_superadmin
  before insert on users
  for each row execute function bootstrap_superadmin();

-- Promote now if the account already exists.
update users
set roles = array_append(roles, 'admin'::user_role)
where email = 'roshan.manuel@gmail.com'
  and not ('admin' = any (roles));
