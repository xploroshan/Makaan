import { z } from "zod";

import { AMENITY_KEYS } from "@/lib/amenities";

import {
  latitude,
  longitude,
  pincode,
  propertyType,
  transactionType,
} from "./common";

/** Body for POST /v1/listings — start a draft for a category. */
export const createListingSchema = z.object({
  transaction_type: transactionType,
  property_type: propertyType,
  title: z.string().min(3).max(120).optional(),
});
export type CreateListingInput = z.infer<typeof createListingSchema>;

export const listingLocationSchema = z.object({
  address: z.string().max(300).optional(),
  locality: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  pincode: pincode.optional(),
  lat: latitude.optional(),
  lng: longitude.optional(),
});

/** Body for PATCH /v1/listings/{id} — update core fields, attributes, location. */
export const updateListingSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().nonnegative().optional(),
  deposit: z.coerce.number().nonnegative().optional(),
  area_sqft: z.coerce.number().positive().optional(),
  bhk: z.coerce.number().int().min(0).max(20).optional(),
  furnishing: z.enum(["unfurnished", "semi", "full"]).optional(),
  available_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "Expected a date")
    .optional(),
  amenities: z.array(z.enum(AMENITY_KEYS)).max(40).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  location: listingLocationSchema.optional(),
});
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

/** Owner-driven lifecycle transitions (PRD §5.2 listing lifecycle). */
export const listingStatusSchema = z.object({
  status: z.enum(["active", "paused", "rented", "sold"]),
});
export type ListingStatusInput = z.infer<typeof listingStatusSchema>;

export const attachMediaSchema = z.object({
  type: z.enum(["photo", "video", "tour360"]).default("photo"),
  url: z.string().url(),
  sort_order: z.coerce.number().int().min(0).default(0),
});
export type AttachMediaInput = z.infer<typeof attachMediaSchema>;
