import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listShortlistIds } from "@/lib/services/shortlist";

/** GET /v1/me/shortlist/ids — saved listing IDs (drives the ♥ state). */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await listShortlistIds(supabase, user.id), { requestId });
});
