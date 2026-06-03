import { z } from "zod";

/** Body for adding a listing to the caller's saved homes. */
export const shortlistSchema = z.object({
  listing_id: z.string().uuid(),
});
export type ShortlistInput = z.infer<typeof shortlistSchema>;
