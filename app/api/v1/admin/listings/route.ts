import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { listListingsForModeration } from "@/lib/services/admin";

/** GET /v1/admin/listings?status= — moderation queue (RBAC). */
export const GET = apiHandler(async ({ req, requestId }) => {
  const { admin } = await requireAdminContext();
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  return ok(await listListingsForModeration(admin, status), { requestId });
});
