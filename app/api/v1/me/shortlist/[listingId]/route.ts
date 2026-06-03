import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { removeFromShortlist } from "@/lib/services/shortlist";

type Params = { listingId: string };

/** DELETE /v1/me/shortlist/{listingId} — remove a saved home. */
export const DELETE = apiHandler<Params>(async ({ params, requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await removeFromShortlist(supabase, user.id, params.listingId), {
    requestId,
  });
});
