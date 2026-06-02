import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listMyVerifications } from "@/lib/services/verifications";

/** GET /v1/me/verifications — the caller's verification submissions. */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const records = await listMyVerifications(supabase, user.id);
  return ok(records, { requestId });
});
