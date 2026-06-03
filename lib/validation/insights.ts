import { z } from "zod";

import { transactionType } from "./common";

/** Query params for GET /v1/insights. */
export const insightsQuerySchema = z.object({
  city: z.string().trim().max(120).optional(),
  locality: z.string().trim().max(120).optional(),
  transaction_type: transactionType.optional(),
});
export type InsightsQuery = z.infer<typeof insightsQuerySchema>;
