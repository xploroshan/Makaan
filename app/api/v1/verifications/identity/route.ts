import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { submitVerification } from "@/lib/services/verifications";
import { submitVerificationSchema } from "@/lib/validation/verification";

/** POST /v1/verifications/identity — submit KYC evidence for review. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, submitVerificationSchema);
  const supabase = await createSupabaseServerClient();
  const record = await submitVerification(supabase, user.id, "identity", input);
  return created(record, { requestId });
});
