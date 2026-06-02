import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { listReports } from "@/lib/services/admin";

/** GET /v1/admin/reports?status=open — moderation reports (RBAC). */
export const GET = apiHandler(async ({ req, requestId }) => {
  const { admin } = await requireAdminContext();
  const status = req.nextUrl.searchParams.get("status") ?? "open";
  return ok(await listReports(admin, status), { requestId });
});
