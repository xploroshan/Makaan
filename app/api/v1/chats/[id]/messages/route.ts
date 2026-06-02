import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { listMessages, sendMessage } from "@/lib/services/chat";
import { sendMessageSchema } from "@/lib/validation/connect";

type Params = { id: string };

/** GET /v1/chats/{id}/messages — message history (participants only via RLS). */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const messages = await listMessages(supabase, params.id);
  return ok(messages, { requestId });
});

/** POST /v1/chats/{id}/messages — send a screened message. */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  const user = await requireUser();
  const { body } = await parseJson(req, sendMessageSchema);
  const supabase = await createSupabaseServerClient();
  const message = await sendMessage(supabase, params.id, user.id, body);
  return created(message, { requestId });
});
