import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getOwnerDashboard } from "@/lib/services/dashboard";

/** GET /v1/owner/dashboard — listing performance + leads for the caller. */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const dashboard = await getOwnerDashboard(supabase, user.id);
  return ok(dashboard, { requestId });
});
