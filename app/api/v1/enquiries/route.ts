import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createEnquiry } from "@/lib/services/enquiries";
import { createEnquirySchema } from "@/lib/validation/connect";

/** POST /v1/enquiries — express interest; opens a chat, contact stays hidden. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, createEnquirySchema);
  const supabase = await createSupabaseServerClient();
  const result = await createEnquiry(supabase, user.id, input);
  return created(result, { requestId });
});
