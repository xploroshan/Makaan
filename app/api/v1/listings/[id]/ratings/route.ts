import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listListingRatings, rateProperty } from "@/lib/services/ratings";
import { ratePropertySchema } from "@/lib/validation/connect";

type Params = { id: string };

/** GET /v1/listings/{id}/ratings — public property ratings. */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const supabase = await createSupabaseServerClient();
  const ratings = await listListingRatings(supabase, params.id);
  return ok(ratings, { requestId });
});

/** POST /v1/listings/{id}/ratings — rate a property (visit-gated). */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, ratePropertySchema);
  const supabase = await createSupabaseServerClient();
  const rating = await rateProperty(supabase, params.id, user.id, input);
  return created(rating, { requestId });
});
