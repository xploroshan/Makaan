import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listOwnerOffers } from "@/lib/services/offers";

/** GET /v1/owner/offers — applications received across the caller's listings. */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await listOwnerOffers(supabase, user.id), { requestId });
});
