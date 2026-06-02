import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { listVerifications } from "@/lib/services/admin";

/** GET /v1/admin/verifications?status=pending — verification queue (RBAC). */
export const GET = apiHandler(async ({ req, requestId }) => {
  const { admin } = await requireAdminContext();
  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  return ok(await listVerifications(admin, status), { requestId });
});
