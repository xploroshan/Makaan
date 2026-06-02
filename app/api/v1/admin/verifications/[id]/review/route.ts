import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { reviewVerification } from "@/lib/services/admin";
import { reviewVerificationSchema } from "@/lib/validation/admin";

type Params = { id: string };

/** POST /v1/admin/verifications/{id}/review — approve or reject (RBAC). */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  const { user, admin } = await requireAdminContext();
  const { decision } = await parseJson(req, reviewVerificationSchema);
  return ok(await reviewVerification(admin, user.id, params.id, decision), {
    requestId,
  });
});
