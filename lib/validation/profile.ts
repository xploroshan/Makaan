import { z } from "zod";

/** PATCH body for the seeker profile (all fields optional / partial update). */
export const seekerProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  city: z.string().max(120).optional(),
  occupation: z.string().max(120).optional(),
  is_student: z.boolean().optional(),
  languages: z.array(z.string().max(40)).max(10).optional(),
  privacy: z
    .object({
      show_bio: z.boolean(),
      show_occupation: z.boolean(),
      show_lifestyle: z.boolean(),
    })
    .partial()
    .optional(),
});
export type SeekerProfileInput = z.infer<typeof seekerProfileSchema>;

export const lifestyleProfileSchema = z.object({
  schedule: z.enum(["early_bird", "night_owl", "flexible"]).optional(),
  food: z.enum(["veg", "non_veg", "eggetarian", "vegan"]).optional(),
  cleanliness: z.enum(["relaxed", "moderate", "very_tidy"]).optional(),
  smoking: z.boolean().optional(),
  pets: z.boolean().optional(),
  guests: z.enum(["rarely", "sometimes", "often"]).optional(),
  gender_pref: z.enum(["any", "male", "female"]).optional(),
});
export type LifestyleProfileInput = z.infer<typeof lifestyleProfileSchema>;
