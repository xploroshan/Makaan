import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { deleteSavedSearch } from "@/lib/services/alerts";

type Params = { id: string };

/** DELETE /v1/me/saved-searches/{id} — remove a saved search (own only via RLS). */
export const DELETE = apiHandler<Params>(async ({ params, requestId }) => {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  await deleteSavedSearch(supabase, params.id);
  return ok({ id: params.id, deleted: true }, { requestId });
});
