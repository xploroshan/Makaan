import { z } from "zod";

/** Shared validation primitives reused across forms and /api/v1 handlers. */

export const uuid = z.string().uuid();

/** Indian PIN code: 6 digits, first digit 1-9. */
export const pincode = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code");

/** E.164-ish phone number. */
export const phone = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid phone number");

export const latitude = z.coerce.number().min(-90).max(90);
export const longitude = z.coerce.number().min(-180).max(180);

/** Cursor-pagination query shared by list endpoints. */
export const paginationQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const transactionType = z.enum(["rent", "lease", "coliving", "sale"]);
export const propertyType = z.enum(["flat", "house", "land"]);

export type TransactionType = z.infer<typeof transactionType>;
export type PropertyType = z.infer<typeof propertyType>;
