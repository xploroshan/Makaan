import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listMyVisits } from "@/lib/services/visits";

/** GET /v1/me/visits — visits the caller is part of (as seeker or owner). */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const visits = await listMyVisits(supabase, user.id);
  return ok(visits, { requestId });
});
