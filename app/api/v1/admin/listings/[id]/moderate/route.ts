import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { moderateListing } from "@/lib/services/admin";
import { moderateListingSchema } from "@/lib/validation/admin";

type Params = { id: string };

/** POST /v1/admin/listings/{id}/moderate — approve/reject/feature/remove (RBAC). */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  const { user, admin } = await requireAdminContext();
  const input = await parseJson(req, moderateListingSchema);
  return ok(await moderateListing(admin, user.id, params.id, input), {
    requestId,
  });
});
