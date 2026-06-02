import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { registerAgent } from "@/lib/services/agents";
import { registerAgentSchema } from "@/lib/validation/agent";

/** POST /v1/agents — register the current user as an agent / company. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, registerAgentSchema);
  const supabase = await createSupabaseServerClient();
  const agent = await registerAgent(supabase, user.id, input);
  return created(agent, { requestId });
});
