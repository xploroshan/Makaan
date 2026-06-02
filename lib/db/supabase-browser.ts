import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

/** Singleton browser Supabase client for Client Components. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseEnv.url(), supabaseEnv.anonKey());
}
