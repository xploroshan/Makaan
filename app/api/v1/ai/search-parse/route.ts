import { z } from "zod";

import { ok } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/errors";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { isAiConfigured } from "@/lib/ai/client";
import { parseNaturalLanguageQuery } from "@/lib/ai/search-parse";
import { isFeatureEnabled } from "@/lib/config/flags";

const bodySchema = z.object({ q: z.string().trim().min(1).max(500) });

/** POST /v1/ai/search-parse — natural-language → structured filters (gated). */
export const POST = apiHandler(async ({ req, requestId }) => {
  if (!(await isFeatureEnabled("feature.nl_search"))) {
    throw ApiError.forbidden("Natural-language search is not enabled");
  }
  if (!isAiConfigured()) {
    throw ApiError.forbidden("AI is not configured on this deployment");
  }
  const { q } = await parseJson(req, bodySchema);
  const filters = await parseNaturalLanguageQuery(q);
  return ok({ filters }, { requestId });
});
