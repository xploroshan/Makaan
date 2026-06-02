import { ApiError } from "@/lib/api/errors";

import { AI_MODEL, getAnthropic } from "./client";
import { coerceParsedFilters, parsedQuerySchema } from "./coerce";
import { firstText, jsonSchemaFormat } from "./json";

const SYSTEM_PROMPT = `You parse natural-language property search queries for
Dwello (India-first) into structured filters. Extract only what the user states
or clearly implies; leave a field null if unspecified. Notes:
- Money: interpret Indian shorthand — "25k" = 25000, "1.2 cr"/"1.2 crore" = 12000000,
  "50 lakh"/"50L" = 5000000. "under 30k" → price_max 30000; "above 20k" → price_min 20000.
- "2BHK" → bhk 2. "PG"/"shared"/"roommate" → transaction_type "coliving".
- "buy"/"sale" → "sale"; "rent" → "rent"; "lease" → "lease".
- "plot"/"land" → property_type "land".
- Put remaining distinctive keywords (e.g. "sea-facing", "near metro") into q.`;

const enumOrNull = (values: string[]) => ({
  type: ["string", "null"],
  enum: [...values, null],
});

const JSON_SCHEMA = {
  type: "object",
  properties: {
    transaction_type: enumOrNull(["rent", "lease", "coliving", "sale"]),
    property_type: enumOrNull(["flat", "house", "land"]),
    bhk: { type: ["integer", "null"] },
    price_min: { type: ["number", "null"] },
    price_max: { type: ["number", "null"] },
    furnishing: enumOrNull(["unfurnished", "semi", "full"]),
    city: { type: ["string", "null"] },
    pincode: { type: ["string", "null"] },
    q: { type: ["string", "null"], description: "Leftover free-text keywords" },
  },
  required: [
    "transaction_type",
    "property_type",
    "bhk",
    "price_min",
    "price_max",
    "furnishing",
    "city",
    "pincode",
    "q",
  ],
  additionalProperties: false,
};

/** Parse a free-text query into sanitized search params (PRD §5.3 NL search). */
export async function parseNaturalLanguageQuery(
  text: string,
): Promise<Record<string, string>> {
  const client = getAnthropic();
  if (!client) throw new ApiError("internal_error", "AI is not configured");

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: text.slice(0, 500) }],
    output_config: { format: jsonSchemaFormat("property_query", JSON_SCHEMA) },
  });

  const raw = firstText(message);
  const parsed = raw ? parsedQuerySchema.safeParse(safeJson(raw)) : null;
  if (!parsed || !parsed.success) {
    throw new ApiError("internal_error", "Could not parse the query");
  }
  return coerceParsedFilters(parsed.data);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
