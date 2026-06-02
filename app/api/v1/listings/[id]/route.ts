import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { getSessionUser, requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getListingDetail, updateListing } from "@/lib/services/listings";
import { updateListingSchema } from "@/lib/validation/listing";

type Params = { id: string };

/** GET /v1/listings/{id} — public listing detail (address masked). */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const viewer = await getSessionUser();
  const supabase = await createSupabaseServerClient();
  const listing = await getListingDetail(
    supabase,
    params.id,
    viewer?.id ?? null,
  );
  return ok(listing, { requestId });
});

/** PATCH /v1/listings/{id} — update fields, attributes and location. */
export const PATCH = apiHandler<Params>(async ({ req, params, requestId }) => {
  await requireUser();
  const input = await parseJson(req, updateListingSchema);
  const supabase = await createSupabaseServerClient();
  const listing = await updateListing(supabase, params.id, input);
  return ok(listing, { requestId });
});
