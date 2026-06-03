import { z } from "zod";

import { latitude, longitude, propertyType, transactionType } from "./common";

/** Sort options exposed by the search engine. */
export const sortOption = z
  .enum(["relevance", "newest", "price_asc", "price_desc"])
  .default("newest");
export type SortOption = z.infer<typeof sortOption>;

/**
 * Query schema for GET /v1/search. All params arrive as strings and are
 * coerced. A geo search needs lat+lng (radius optional, defaults applied
 * downstream). Pincode/city scope to a postal area / city.
 */
export const searchQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/)
      .optional(),
    city: z.string().max(120).optional(),
    transaction_type: transactionType.optional(),
    property_type: propertyType.optional(),
    bhk: z.coerce.number().int().min(0).max(20).optional(),
    furnishing: z.enum(["unfurnished", "semi", "full"]).optional(),
    price_min: z.coerce.number().nonnegative().optional(),
    price_max: z.coerce.number().nonnegative().optional(),
    // Comma-separated amenity keys; listings must have all of them.
    amenities: z.string().max(400).optional(),
    lat: latitude.optional(),
    lng: longitude.optional(),
    radius_m: z.coerce.number().int().min(100).max(50000).optional(),
    sort: sortOption,
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine(
    (v) =>
      (v.lat === undefined && v.lng === undefined) ||
      (v.lat !== undefined && v.lng !== undefined),
    { message: "lat and lng must be provided together", path: ["lat"] },
  )
  .refine(
    (v) =>
      v.price_min === undefined ||
      v.price_max === undefined ||
      v.price_min <= v.price_max,
    { message: "price_min must be ≤ price_max", path: ["price_min"] },
  );

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/** Whether the query requests a geospatial radius search. */
export function isGeoSearch(
  q: SearchQuery,
): q is SearchQuery & { lat: number; lng: number } {
  return q.lat !== undefined && q.lng !== undefined;
}
