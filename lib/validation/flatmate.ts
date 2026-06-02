import { z } from "zod";

export const flatmateKind = z.enum(["has_place", "needs_place"]);
export const flatmateOccupancy = z.enum(["private", "shared"]);
export const flatmateGenderPref = z.enum(["any", "male", "female"]);

/** Body for publishing a flatmate post. */
export const createFlatmatePostSchema = z
  .object({
    kind: flatmateKind,
    city: z.string().trim().min(1).max(120),
    locality: z.string().trim().max(120).optional(),
    budget_min: z.coerce.number().nonnegative().max(10_000_000).optional(),
    budget_max: z.coerce.number().nonnegative().max(10_000_000).optional(),
    move_in: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    gender_pref: flatmateGenderPref.default("any"),
    occupancy: flatmateOccupancy.default("shared"),
    headline: z.string().trim().min(4).max(120),
    description: z.string().trim().max(2000).optional(),
  })
  .refine(
    (v) =>
      v.budget_min === undefined ||
      v.budget_max === undefined ||
      v.budget_min <= v.budget_max,
    { message: "budget_min must be ≤ budget_max", path: ["budget_min"] },
  );
export type CreateFlatmatePostInput = z.infer<typeof createFlatmatePostSchema>;

/** Query params for browsing flatmate posts. */
export const flatmateQuerySchema = z.object({
  city: z.string().trim().max(120).optional(),
  kind: flatmateKind.optional(),
  gender_pref: flatmateGenderPref.optional(),
  occupancy: flatmateOccupancy.optional(),
  budget_max: z.coerce.number().nonnegative().optional(),
});
export type FlatmateQuery = z.infer<typeof flatmateQuerySchema>;

/** Patch body — currently only used to close a post. */
export const updateFlatmatePostSchema = z.object({
  status: z.enum(["active", "closed"]),
});
export type UpdateFlatmatePostInput = z.infer<typeof updateFlatmatePostSchema>;
