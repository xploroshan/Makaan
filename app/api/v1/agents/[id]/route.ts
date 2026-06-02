import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getAgentById, updateAgent } from "@/lib/services/agents";
import { updateAgentSchema } from "@/lib/validation/agent";

type Params = { id: string };

/** GET /v1/agents/{id} — public agent / broker profile. */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const supabase = await createSupabaseServerClient();
  const agent = await getAgentById(supabase, params.id);
  return ok(agent, { requestId });
});

/** PATCH /v1/agents/{id} — update banner, brokerage, about (owner only via RLS). */
export const PATCH = apiHandler<Params>(async ({ req, params, requestId }) => {
  await requireUser();
  const input = await parseJson(req, updateAgentSchema);
  const supabase = await createSupabaseServerClient();
  const agent = await updateAgent(supabase, params.id, input);
  return ok(agent, { requestId });
});
