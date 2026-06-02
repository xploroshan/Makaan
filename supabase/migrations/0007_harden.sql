-- ============================================================================
-- Security hardening (Supabase advisor remediation).
-- - Pins search_path on helper/trigger functions.
-- - Removes trigger-only SECURITY DEFINER functions from the public RPC surface
--   (triggers still fire; they run under the table owner). is_admin() and
--   increment_listing_view() are intentionally left executable — they're used
--   by RLS policies and the public view-count RPC respectively.
-- ============================================================================
alter function public.set_updated_at() set search_path = public;
alter function public.listings_tsv_update() set search_path = public;
alter function public.locations_sync_geom() set search_path = public;
alter function public.listings_within_radius(double precision, double precision, double precision)
  set search_path = public;

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.bootstrap_superadmin() from anon, authenticated;
revoke execute on function public.prevent_role_escalation() from anon, authenticated;
revoke execute on function public.recompute_agent_rating() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.listings_tsv_update() from anon, authenticated;
revoke execute on function public.locations_sync_geom() from anon, authenticated;
