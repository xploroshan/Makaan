import { z } from "zod";

/** Body for reviewing another user (seeker ↔ owner). */
export const userReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().max(1000).optional(),
});
export type UserReviewInput = z.infer<typeof userReviewSchema>;
