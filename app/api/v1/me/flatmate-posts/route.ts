import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listMyFlatmatePosts } from "@/lib/services/flatmates";

/** GET /v1/me/flatmate-posts — the caller's flatmate posts (any status). */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  return ok(await listMyFlatmatePosts(supabase, user.id), { requestId });
});
