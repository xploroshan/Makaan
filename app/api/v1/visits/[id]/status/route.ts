import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { updateVisitStatus } from "@/lib/services/visits";
import { visitStatusSchema } from "@/lib/validation/connect";

type Params = { id: string };

/** POST /v1/visits/{id}/status — confirm / complete / cancel a visit. */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  await requireUser();
  const { status } = await parseJson(req, visitStatusSchema);
  const supabase = await createSupabaseServerClient();
  const visit = await updateVisitStatus(supabase, params.id, status);
  return ok(visit, { requestId });
});
