import { ok } from "@/lib/api/envelope";
import { apiHandler, parseQuery } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getAreaInsights } from "@/lib/services/insights";
import { insightsQuerySchema } from "@/lib/validation/insights";

/** GET /v1/insights — market stats + price trend for an area. */
export const GET = apiHandler(async ({ req, requestId }) => {
  const filters = parseQuery(req, insightsQuerySchema);
  const supabase = await createSupabaseServerClient();
  return ok(await getAreaInsights(supabase, filters), { requestId });
});
