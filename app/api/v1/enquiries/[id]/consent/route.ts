import { ok } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { respondToEnquiry } from "@/lib/services/enquiries";
import { enquiryConsentSchema } from "@/lib/validation/connect";

type Params = { id: string };

/** POST /v1/enquiries/{id}/consent — owner accepts (reveals contact) or declines. */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  await requireUser();
  const { action } = await parseJson(req, enquiryConsentSchema);
  const supabase = await createSupabaseServerClient();
  const enquiry = await respondToEnquiry(supabase, params.id, action);
  return ok(enquiry, { requestId });
});
