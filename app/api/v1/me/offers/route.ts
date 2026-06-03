import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listMyOffers } from "@/lib/services/offers";

/** GET /v1/me/offers — applications the caller has submitted. */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await listMyOffers(supabase, user.id), { requestId });
});
