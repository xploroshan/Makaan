import { z } from "zod";

import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { startDirectChat } from "@/lib/services/chat";

const bodySchema = z.object({ user_id: z.string().uuid() });

/** POST /v1/chats/direct — find or open a direct chat with another user. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const me = await requireUser();
  const { user_id } = await parseJson(req, bodySchema);
  const supabase = await createSupabaseServerClient();
  return created(await startDirectChat(supabase, me.id, user_id), {
    requestId,
  });
});
