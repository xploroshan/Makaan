import { ok } from "@/lib/api/envelope";
import { apiHandler, parseQuery } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { searchListings } from "@/lib/services/search";
import { searchQuerySchema } from "@/lib/validation/search";

/** GET /v1/search — faceted + pincode + geo search over active listings. */
export const GET = apiHandler(async ({ req, requestId }) => {
  const query = parseQuery(req, searchQuerySchema);
  const supabase = await createSupabaseServerClient();
  const { items, nextCursor } = await searchListings(supabase, query);
  return ok(items, { requestId, nextCursor });
});
