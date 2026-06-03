import { created, ok } from "@/lib/api/envelope";
import { apiHandler, parseJson, parseQuery } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import {
  createFlatmatePost,
  listFlatmatePosts,
} from "@/lib/services/flatmates";
import {
  createFlatmatePostSchema,
  flatmateQuerySchema,
} from "@/lib/validation/flatmate";

/** GET /v1/flatmates — browse active flatmate posts. */
export const GET = apiHandler(async ({ req, requestId }) => {
  const filters = parseQuery(req, flatmateQuerySchema);
  const supabase = await createSupabaseServerClient();
  return ok(await listFlatmatePosts(supabase, filters), { requestId });
});

/** POST /v1/flatmates — publish a flatmate post. */
export const POST = apiHandler(async ({ req, requestId }) => {
  const user = await requireUser();
  const input = await parseJson(req, createFlatmatePostSchema);
  const supabase = await createSupabaseServerClient();
  return created(await createFlatmatePost(supabase, user.id, input), {
    requestId,
  });
});
