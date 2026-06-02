import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { verifyAgent } from "@/lib/services/admin";
import { verifyAgentSchema } from "@/lib/validation/admin";

type Params = { id: string };

/** POST /v1/admin/agents/{id}/verify — toggle the verified-pro badge (RBAC). */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  const { user, admin } = await requireAdminContext();
  const { verified } = await parseJson(req, verifyAgentSchema);
  return ok(await verifyAgent(admin, user.id, params.id, verified), {
    requestId,
  });
});
