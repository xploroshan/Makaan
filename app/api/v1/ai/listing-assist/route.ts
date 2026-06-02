import { z } from "zod";

import { ok } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/errors";
import { apiHandler, parseJson } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { isAiConfigured } from "@/lib/ai/client";
import { generateListingCopy } from "@/lib/ai/listing-assist";
import { isFeatureEnabled } from "@/lib/config/flags";
import { propertyType, transactionType } from "@/lib/validation/common";

const bodySchema = z.object({
  transaction_type: transactionType,
  property_type: propertyType,
  attributes: z.record(z.string(), z.unknown()).default({}),
  locality: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
});

/** POST /v1/ai/listing-assist — generate a title + description (feature-gated). */
export const POST = apiHandler(async ({ req, requestId }) => {
  await requireUser();
  if (!(await isFeatureEnabled("feature.ai_listing_assist"))) {
    throw ApiError.forbidden("AI listing assistant is not enabled");
  }
  if (!isAiConfigured()) {
    throw ApiError.forbidden("AI is not configured on this deployment");
  }
  const input = await parseJson(req, bodySchema);
  const copy = await generateListingCopy(input);
  return ok(copy, { requestId });
});
