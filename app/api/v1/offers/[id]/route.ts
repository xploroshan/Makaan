import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { updateOfferStatus } from "@/lib/services/offers";
import { offerStatusSchema } from "@/lib/validation/offer";

type Params = { id: string };

/** PATCH /v1/offers/{id} — accept / decline / withdraw / finalise an offer. */
export const PATCH = apiHandler<Params>(async ({ req, params, requestId }) => {
  const user = await requireUser();
  const { status } = await parseJson(req, offerStatusSchema);
  const supabase = await createSupabaseServerClient();
  return ok(await updateOfferStatus(supabase, user.id, params.id, status), {
    requestId,
  });
});
