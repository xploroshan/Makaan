import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { submitReport } from "@/lib/services/reports";
import { reportSchema } from "@/lib/validation/connect";

/** POST /v1/reports — file a listing/user/message report for moderation. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, reportSchema);
  const supabase = await createSupabaseServerClient();
  const report = await submitReport(supabase, user.id, input);
  return created(report, { requestId });
});
