import { z } from "zod";

/** Schema the model fills in when parsing a natural-language property query. */
export const parsedQuerySchema = z.object({
  transaction_type: z
    .enum(["rent", "lease", "coliving", "sale"])
    .nullable()
    .optional(),
  property_type: z.enum(["flat", "house", "land"]).nullable().optional(),
  bhk: z.number().int().nullable().optional(),
  price_min: z.number().nullable().optional(),
  price_max: z.number().nullable().optional(),
  furnishing: z.enum(["unfurnished", "semi", "full"]).nullable().optional(),
  city: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  q: z
    .string()
    .nullable()
    .optional()
    .describe("Leftover free-text keywords not captured by other fields"),
});

export type ParsedQuery = z.infer<typeof parsedQuerySchema>;

/**
 * Convert the model's parsed query into sanitized, clamped search params
 * suitable for the /search URL and the search API. Pure + unit-tested:
 * drops empty values, bounds numbers, and validates the pincode shape so a
 * hallucinated value can never reach the query layer unchecked.
 */
export function coerceParsedFilters(
  parsed: ParsedQuery,
): Record<string, string> {
  const out: Record<string, string> = {};

  if (parsed.transaction_type) out.transaction_type = parsed.transaction_type;
  if (parsed.property_type) out.property_type = parsed.property_type;
  if (parsed.furnishing) out.furnishing = parsed.furnishing;

  if (isFiniteNumber(parsed.bhk)) {
    out.bhk = String(clamp(Math.round(parsed.bhk), 0, 20));
  }
  if (isFiniteNumber(parsed.price_min) && parsed.price_min >= 0) {
    out.price_min = String(Math.round(parsed.price_min));
  }
  if (isFiniteNumber(parsed.price_max) && parsed.price_max >= 0) {
    out.price_max = String(Math.round(parsed.price_max));
  }
  // Drop an inverted range rather than passing something the API will reject.
  if (
    out.price_min &&
    out.price_max &&
    Number(out.price_min) > Number(out.price_max)
  ) {
    delete out.price_min;
    delete out.price_max;
  }

  if (parsed.city && parsed.city.trim())
    out.city = parsed.city.trim().slice(0, 120);
  if (parsed.pincode && /^[1-9][0-9]{5}$/.test(parsed.pincode.trim())) {
    out.pincode = parsed.pincode.trim();
  }
  if (parsed.q && parsed.q.trim()) out.q = parsed.q.trim().slice(0, 200);

  return out;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
