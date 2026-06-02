import { created } from "@/lib/api/envelope";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { attachMedia } from "@/lib/services/listings";
import { attachMediaSchema } from "@/lib/validation/listing";

type Params = { id: string };

/** POST /v1/listings/{id}/media — attach an uploaded photo/video/360 asset. */
export const POST = apiHandler<Params>(async ({ req, params, requestId }) => {
  await requireUser();
  const input = await parseJson(req, attachMediaSchema);
  const supabase = await createSupabaseServerClient();
  const media = await attachMedia(supabase, params.id, input);
  return created(media, { requestId });
});
