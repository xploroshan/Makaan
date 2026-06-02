import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { getPlatformStats } from "@/lib/services/admin";

/** GET /v1/admin/stats — platform-wide counts. */
export const GET = apiHandler(async ({ requestId }) => {
  const { admin } = await requireAdminContext();
  return ok(await getPlatformStats(admin), { requestId });
});
