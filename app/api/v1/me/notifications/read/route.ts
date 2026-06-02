import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { markAllRead } from "@/lib/services/alerts";

/** POST /v1/me/notifications/read — mark all notifications as read. */
export const POST = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  await markAllRead(supabase, user.id);
  return ok({ ok: true }, { requestId });
});
