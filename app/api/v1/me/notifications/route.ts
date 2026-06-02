import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import {
  listNotifications,
  runSavedSearchMatches,
} from "@/lib/services/alerts";

/**
 * GET /v1/me/notifications — runs the saved-search matcher (lazy, no cron),
 * then returns the inbox + unread count.
 */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  await runSavedSearchMatches(supabase, user.id);
  return ok(await listNotifications(supabase, user.id), { requestId });
});
