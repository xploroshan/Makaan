import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listAgentReviews, reviewAgent } from "@/lib/services/agents";
import { agentReviewSchema } from "@/lib/validation/agent";

type Params = { id: string };

/** GET /v1/agents/{id}/reviews — public reviews for an agent. */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const supabase = await createSupabaseServerClient();
  const reviews = await listAgentReviews(supabase, params.id);
  return ok(reviews, { requestId });
});

/** POST /v1/agents/{id}/reviews — rate an agent (one review per user). */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, agentReviewSchema);
  const supabase = await createSupabaseServerClient();
  const review = await reviewAgent(supabase, params.id, user.id, input);
  return created(review, { requestId });
});
