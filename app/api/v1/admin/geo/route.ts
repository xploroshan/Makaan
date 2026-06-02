import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { listGeo, upsertGeo } from "@/lib/services/admin";
import { geoAdminSchema } from "@/lib/validation/admin";

/** GET /v1/admin/geo?q= — geography catalogue (RBAC). */
export const GET = apiHandler(async ({ req, requestId }) => {
  const { admin } = await requireAdminContext();
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  return ok(await listGeo(admin, q), { requestId });
});

/** POST /v1/admin/geo — add a city/locality/pincode (no-deploy). */
export const POST = apiHandler(async ({ req, requestId }) => {
  const { user, admin } = await requireAdminContext();
  const input = await parseJson(req, geoAdminSchema);
  return created(await upsertGeo(admin, user.id, input), { requestId });
});
