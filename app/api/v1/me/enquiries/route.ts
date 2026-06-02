import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listMyEnquiries } from "@/lib/services/enquiries";

/** GET /v1/me/enquiries — interests sent (as seeker) and received (as owner). */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const result = await listMyEnquiries(supabase, user.id);
  return ok(result, { requestId });
});
