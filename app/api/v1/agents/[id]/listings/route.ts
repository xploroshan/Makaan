import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getAgentListings } from "@/lib/services/agents";

type Params = { id: string };

/** GET /v1/agents/{id}/listings — the agent's active portfolio. */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const supabase = await createSupabaseServerClient();
  const listings = await getAgentListings(supabase, params.id);
  return ok(listings, { requestId });
});
