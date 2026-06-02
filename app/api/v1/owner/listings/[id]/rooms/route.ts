import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createRoom, listRooms } from "@/lib/services/coliving";
import { colivingRoomSchema } from "@/lib/validation/coliving";

type Params = { id: string };

/** GET /v1/owner/listings/{id}/rooms — rooms + occupancy for one listing. */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await listRooms(supabase, user.id, params.id), { requestId });
});

/** POST /v1/owner/listings/{id}/rooms — add a room to a co-living listing. */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, colivingRoomSchema);
  const supabase = await createSupabaseServerClient();
  return created(await createRoom(supabase, user.id, params.id, input), {
    requestId,
  });
});
