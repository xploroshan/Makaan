import { createClient } from "@supabase/supabase-js";

import { supabaseEnv } from "./env";

/**
 * Service-role Supabase client that BYPASSES Row Level Security.
 * Server-only. Use exclusively for trusted operations (admin console,
 * background jobs, webhooks) after authorization has been checked in code.
 */
export function createSupabaseAdminClient() {
  return createClient(supabaseEnv.url(), supabaseEnv.serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
