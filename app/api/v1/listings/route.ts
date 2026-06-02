import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createDraft } from "@/lib/services/listings";
import { createListingSchema } from "@/lib/validation/listing";

/** POST /v1/listings — start a draft listing for a category. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, createListingSchema);

  const supabase = await createSupabaseServerClient();
  const listing = await createDraft(supabase, user.id, input);

  return created(listing, { requestId });
});
