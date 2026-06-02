import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { deleteRoom, updateRoom } from "@/lib/services/coliving";
import { colivingRoomSchema } from "@/lib/validation/coliving";

type Params = { id: string };

/** PUT /v1/owner/rooms/{id} — update a room (RLS scopes to the caller). */
export const PUT = apiHandler<Params>(async ({ req, params, requestId }) => {
  await requireUser();
  const input = await parseJson(req, colivingRoomSchema);
  const supabase = await createSupabaseServerClient();
  return ok(await updateRoom(supabase, params.id, input), { requestId });
});

/** DELETE /v1/owner/rooms/{id} — remove a room. */
export const DELETE = apiHandler<Params>(async ({ params, requestId }) => {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await deleteRoom(supabase, params.id), { requestId });
});
