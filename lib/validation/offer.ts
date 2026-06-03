import { z } from "zod";

/** Body for applying / making an offer on a listing. */
export const createOfferSchema = z.object({
  offer_price: z.coerce.number().positive().max(1_000_000_000_000),
  deposit: z.coerce.number().nonnegative().max(1_000_000_000_000).optional(),
  move_in: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  duration_months: z.coerce.number().int().min(1).max(240).optional(),
  message: z.string().trim().max(1000).optional(),
});
export type CreateOfferInput = z.infer<typeof createOfferSchema>;

/** Body for changing an offer's status. */
export const offerStatusSchema = z.object({
  status: z.enum(["accepted", "declined", "withdrawn", "completed"]),
});
export type OfferStatusInput = z.infer<typeof offerStatusSchema>;
