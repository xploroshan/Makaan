import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { listFormTemplates, upsertFormTemplate } from "@/lib/services/admin";
import { formTemplateAdminSchema } from "@/lib/validation/admin";

/** GET /v1/admin/forms — all listing form templates (RBAC). */
export const GET = apiHandler(async ({ requestId }) => {
  const { admin } = await requireAdminContext();
  return ok(await listFormTemplates(admin), { requestId });
});

/** PUT /v1/admin/forms — create or update a form template (no-deploy). */
export const PUT = apiHandler(async ({ req, requestId }) => {
  const { user, admin } = await requireAdminContext();
  const input = await parseJson(req, formTemplateAdminSchema);
  return created(await upsertFormTemplate(admin, user.id, input), {
    requestId,
  });
});
