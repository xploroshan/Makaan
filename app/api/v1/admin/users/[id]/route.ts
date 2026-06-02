import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireAdminContext } from "@/lib/auth/admin";
import { updateUser } from "@/lib/services/admin";
import { userAdminSchema } from "@/lib/validation/admin";

type Params = { id: string };

/** PATCH /v1/admin/users/{id} — suspend/ban/activate or set roles (RBAC). */
export const PATCH = apiHandler<Params>(async ({ req, params, requestId }) => {
  const { user, admin } = await requireAdminContext();
  const input = await parseJson(req, userAdminSchema);
  return ok(await updateUser(admin, user.id, params.id, input), { requestId });
});
