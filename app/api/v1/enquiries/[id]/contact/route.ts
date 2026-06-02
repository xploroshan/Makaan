import { ok } from "@/lib/api/envelope";
import { apiHandler } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getRevealedOwnerContact } from "@/lib/services/enquiries";

type Params = { id: string };

/** GET /v1/enquiries/{id}/contact — owner contact, only once consent is given. */
export const GET = apiHandler<Params>(async ({ params, requestId }) => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const contact = await getRevealedOwnerContact(supabase, params.id, user.id);
  return ok(contact, { requestId });
});
