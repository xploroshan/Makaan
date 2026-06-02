import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getMyProfile, upsertSeekerProfile } from "@/lib/services/profiles";
import { seekerProfileSchema } from "@/lib/validation/profile";

/** GET /v1/me/profile — full own profile (user + seeker + lifestyle + trust). */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const profile = await getMyProfile(supabase, user.id);
  return ok(profile, { requestId });
});

/** PATCH /v1/me/profile — update the seeker profile + privacy controls. */
export const PATCH = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, seekerProfileSchema);
  const supabase = await createSupabaseServerClient();
  const seeker = await upsertSeekerProfile(supabase, user.id, input);
  return ok(seeker, { requestId });
});
