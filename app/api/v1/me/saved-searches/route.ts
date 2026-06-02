import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createSavedSearch, listSavedSearches } from "@/lib/services/alerts";
import { createSavedSearchSchema } from "@/lib/validation/alerts";

/** GET /v1/me/saved-searches — the caller's saved searches. */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await listSavedSearches(supabase, user.id), { requestId });
});

/** POST /v1/me/saved-searches — save a search + alert. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, createSavedSearchSchema);
  const supabase = await createSupabaseServerClient();
  return created(await createSavedSearch(supabase, user.id, input), {
    requestId,
  });
});
