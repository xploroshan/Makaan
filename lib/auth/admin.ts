import { createSupabaseAdminClient } from "@/lib/db/supabase-admin";

import { requireRole, type SessionUser } from "./session";

/**
 * Gate an admin endpoint: verify the caller has the admin role, then hand
 * back the service-role client for privileged, audited operations.
 */
export async function requireAdminContext(): Promise<{
  user: SessionUser;
  admin: ReturnType<typeof createSupabaseAdminClient>;
}> {
  const user = await requireRole("admin");
  return { user, admin: createSupabaseAdminClient() };
}
