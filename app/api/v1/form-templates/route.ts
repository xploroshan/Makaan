import { z } from "zod";

import { ok } from "@/lib/api/envelope";
import { ApiError } from "@/lib/api/errors";
import { apiHandler, parseQuery } from "@/lib/api/handler";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { resolveTemplate } from "@/lib/services/form-templates";
import { propertyType, transactionType } from "@/lib/validation/common";

const querySchema = z.object({
  transaction_type: transactionType,
  property_type: propertyType,
});

/** GET /v1/form-templates — the active listing form for a category. */
export const GET = apiHandler(async ({ req, requestId }) => {
  const { transaction_type, property_type } = parseQuery(req, querySchema);
  const supabase = await createSupabaseServerClient();
  const template = await resolveTemplate(
    supabase,
    transaction_type,
    property_type,
  );
  if (!template) throw ApiError.notFound("No form template for this category");
  return ok(template, { requestId });
});
