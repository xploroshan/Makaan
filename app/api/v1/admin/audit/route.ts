import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { listAudit } from "@/lib/services/admin";

/** GET /v1/admin/audit — recent admin actions (RBAC). */
export const GET = apiHandler(async ({ requestId }) => {
  const { admin } = await requireAdminContext();
  return ok(await listAudit(admin), { requestId });
});
