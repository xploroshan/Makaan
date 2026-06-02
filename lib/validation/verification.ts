import { z } from "zod";

import { uuid } from "./common";

/**
 * Submit a verification. `evidence_ref` points at an already-uploaded private
 * document in the `verification-docs` storage bucket; we never accept raw
 * documents through the API.
 */
export const submitVerificationSchema = z.object({
  evidence_ref: z.string().min(1).max(500),
  // Required only for ownership verification of a specific listing.
  listing_id: uuid.optional(),
});
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
