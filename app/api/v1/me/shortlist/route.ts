import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { addToShortlist, listShortlist } from "@/lib/services/shortlist";
import { shortlistSchema } from "@/lib/validation/shortlist";

/** GET /v1/me/shortlist — the caller's saved homes (summaries). */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await listShortlist(supabase, user.id), { requestId });
});

/** POST /v1/me/shortlist — save a listing. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const { listing_id } = await parseJson(req, shortlistSchema);
  const supabase = await createSupabaseServerClient();
  return created(await addToShortlist(supabase, user.id, listing_id), {
    requestId,
  });
});
