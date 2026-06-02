import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { listUsers } from "@/lib/services/admin";

/** GET /v1/admin/users?q= — search users (RBAC). */
export const GET = apiHandler(async ({ req, requestId }) => {
  const { admin } = await requireAdminContext();
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  return ok(await listUsers(admin, q), { requestId });
});
