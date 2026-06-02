import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listUserReviews, reviewUser } from "@/lib/services/reviews";
import { userReviewSchema } from "@/lib/validation/review";

type Params = { id: string };

/** GET /v1/users/{id}/reviews — public reviews + aggregate for a user. */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const supabase = await createSupabaseServerClient();
  return ok(await listUserReviews(supabase, params.id), { requestId });
});

/** POST /v1/users/{id}/reviews — review a user (gated on a real interaction). */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, userReviewSchema);
  const supabase = await createSupabaseServerClient();
  return created(await reviewUser(supabase, user.id, params.id, input), {
    requestId,
  });
});
