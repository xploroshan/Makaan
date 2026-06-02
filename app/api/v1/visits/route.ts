import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { scheduleVisit } from "@/lib/services/visits";
import { scheduleVisitSchema } from "@/lib/validation/connect";

/** POST /v1/visits — propose a visit slot (physical or video). */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, scheduleVisitSchema);
  const supabase = await createSupabaseServerClient();
  const visit = await scheduleVisit(supabase, user.id, input);
  return created(visit, { requestId });
});
