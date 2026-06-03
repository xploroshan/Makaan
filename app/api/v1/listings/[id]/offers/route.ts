import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createOffer } from "@/lib/services/offers";
import { createOfferSchema } from "@/lib/validation/offer";

type Params = { id: string };

/** POST /v1/listings/{id}/offers — apply / make an offer on a listing. */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, createOfferSchema);
  const supabase = await createSupabaseServerClient();
  return created(await createOffer(supabase, user.id, params.id, input), {
    requestId,
  });
});
