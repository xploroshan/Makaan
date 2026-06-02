import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { setStatus } from "@/lib/services/listings";
import { listingStatusSchema } from "@/lib/validation/listing";

type Params = { id: string };

/** POST /v1/listings/{id}/status — publish / pause / mark rented-sold. */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  await requireUser();
  const { status } = await parseJson(req, listingStatusSchema);
  const supabase = await createSupabaseServerClient();
  const listing = await setStatus(supabase, params.id, status);
  return ok(listing, { requestId });
});
