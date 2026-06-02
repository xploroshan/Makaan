import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { setGeoEnabled } from "@/lib/services/admin";
import { geoUpdateSchema } from "@/lib/validation/admin";

type Params = { id: string };

/** PATCH /v1/admin/geo/{id} — enable/disable a geo entry (RBAC). */
export const PATCH = apiHandler<Params>(async ({ req, params, requestId }) => {
  const { user, admin } = await requireAdminContext();
  const { enabled } = await parseJson(req, geoUpdateSchema);
  return ok(await setGeoEnabled(admin, user.id, params.id, enabled), {
    requestId,
  });
});
