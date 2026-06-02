import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { upsertLifestyleProfile } from "@/lib/services/profiles";
import { lifestyleProfileSchema } from "@/lib/validation/profile";

/** PATCH /v1/me/lifestyle — update co-living lifestyle preferences. */
export const PATCH = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, lifestyleProfileSchema);
  const supabase = await createSupabaseServerClient();
  const lifestyle = await upsertLifestyleProfile(supabase, user.id, input);
  return ok(lifestyle, { requestId });
});
