import { apiHandler, parseJson } from "@/lib/api/handler";
import { ok } from "@/lib/api/envelope";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { z } from "zod";

/** GET /v1/me — current authenticated profile. */
export const GET = apiHandler(async ({ requestId }) => {
  const user = await requireUser();
  return ok(user, { requestId });
});

const preferencesSchema = z.object({
  locale: z.string().min(2).max(10).optional(),
  currency: z.string().length(3).optional(),
  notifications: z.record(z.string(), z.boolean()).optional(),
});

/** PATCH /v1/me/preferences would live at its own path; this updates the user row. */
export const PATCH = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const patch = await parseJson(req, preferencesSchema);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .update({
      ...(patch.locale ? { locale: patch.locale } : {}),
      ...(patch.currency ? { currency: patch.currency } : {}),
      ...(patch.notifications ? { notifications: patch.notifications } : {}),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return ok(data, { requestId });
});
