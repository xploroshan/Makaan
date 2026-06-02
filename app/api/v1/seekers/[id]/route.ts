import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getPublicSeekerProfile } from "@/lib/services/profiles";

type Params = { id: string };

/** GET /v1/seekers/{id} — privacy-respecting public seeker profile. */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const supabase = await createSupabaseServerClient();
  const profile = await getPublicSeekerProfile(supabase, params.id);
  return ok(profile, { requestId });
});
