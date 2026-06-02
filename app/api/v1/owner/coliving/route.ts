import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { colivingOverview } from "@/lib/services/coliving";

/** GET /v1/owner/coliving — portfolio-wide co-living occupancy for the caller. */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await colivingOverview(supabase, user.id), { requestId });
});
