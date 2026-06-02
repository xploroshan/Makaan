import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { updateReport } from "@/lib/services/admin";
import { reportUpdateSchema } from "@/lib/validation/admin";

type Params = { id: string };

/** PATCH /v1/admin/reports/{id} — set moderation status (RBAC). */
export const PATCH = apiHandler<Params>(async ({ req, params, requestId }) => {
  const { user, admin } = await requireAdminContext();
  const { status } = await parseJson(req, reportUpdateSchema);
  return ok(await updateReport(admin, user.id, params.id, status), {
    requestId,
  });
});
