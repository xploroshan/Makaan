import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { submitVerification } from "@/lib/services/verifications";
import { submitVerificationSchema } from "@/lib/validation/verification";

/** POST /v1/verifications/ownership — submit ownership proof for a listing. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, submitVerificationSchema);
  const supabase = await createSupabaseServerClient();
  const record = await submitVerification(
    supabase,
    user.id,
    "ownership",
    input,
  );
  return created(record, { requestId });
});
