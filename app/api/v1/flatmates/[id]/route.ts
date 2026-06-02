import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import {
  getFlatmatePost,
  setFlatmatePostStatus,
} from "@/lib/services/flatmates";
import { updateFlatmatePostSchema } from "@/lib/validation/flatmate";

type Params = { id: string };

/** GET /v1/flatmates/{id} — a single flatmate post. */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const supabase = await createSupabaseServerClient();
  return ok(await getFlatmatePost(supabase, params.id), { requestId });
});

/** PATCH /v1/flatmates/{id} — author closes/reopens their post. */
export const PATCH = apiHandler<Params>(async ({ req, params, requestId }) => {
  await requireUser();
  const { status } = await parseJson(req, updateFlatmatePostSchema);
  const supabase = await createSupabaseServerClient();
  return ok(await setFlatmatePostStatus(supabase, params.id, status), {
    requestId,
  });
});
