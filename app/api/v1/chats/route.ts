import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listChats } from "@/lib/services/chat";

/** GET /v1/chats — the caller's chat threads. */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const chats = await listChats(supabase, user.id);
  return ok(chats, { requestId });
});
