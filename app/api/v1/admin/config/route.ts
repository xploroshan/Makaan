import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { listConfig, upsertConfig } from "@/lib/services/admin";
import { configAdminSchema } from "@/lib/validation/admin";

/** GET /v1/admin/config — feature flags, pricing & CMS config (RBAC). */
export const GET = apiHandler(async ({ requestId }) => {
  const { admin } = await requireAdminContext();
  return ok(await listConfig(admin), { requestId });
});

/** PUT /v1/admin/config — set a config/flag value live (no-deploy). */
export const PUT = apiHandler(async ({ req, requestId }) => {
  const { user, admin } = await requireAdminContext();
  const input = await parseJson(req, configAdminSchema);
  return ok(await upsertConfig(admin, user.id, input), { requestId });
});
