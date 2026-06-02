import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Untyped Supabase client alias used across the service layer. Once we run
 * `supabase gen types`, this can be parameterised with the generated
 * `Database` type for end-to-end type safety.
 */
export type DbClient = SupabaseClient;
