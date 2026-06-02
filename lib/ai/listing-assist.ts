import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import type { PropertyType, TransactionType } from "@/lib/validation/common";

import { AI_MODEL, getAnthropic } from "./client";
import { firstText, jsonSchemaFormat } from "./json";

const SYSTEM_PROMPT = `You are Dwello's listing copywriter. Given a property's
category and structured attributes, write a crisp, honest, India-market listing.
Rules:
- Title: <= 80 characters, specific and scannable (BHK, locality, standout feature).
- Description: 2-4 short paragraphs, factual, no fabricated amenities, no emojis,
  no ALL CAPS, no contact details or external links.
- Use only the facts provided; never invent prices, sizes, or approvals.`;

const ListingCopySchema = z.object({
  title: z.string(),
  description: z.string(),
});

const JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Listing title, <= 80 characters" },
    description: {
      type: "string",
      description: "2-4 short factual paragraphs",
    },
  },
  required: ["title", "description"],
  additionalProperties: false,
};

export type ListingCopy = z.infer<typeof ListingCopySchema>;

/** Generate a polished title + description from listing attributes (PRD §5.2). */
export async function generateListingCopy(input: {
  transaction_type: TransactionType;
  property_type: PropertyType;
  attributes: Record<string, unknown>;
  locality?: string | null;
  city?: string | null;
}): Promise<ListingCopy> {
  const client = getAnthropic();
  if (!client) throw new ApiError("internal_error", "AI is not configured");

  const facts = JSON.stringify(
    {
      transaction_type: input.transaction_type,
      property_type: input.property_type,
      locality: input.locality ?? undefined,
      city: input.city ?? undefined,
      attributes: input.attributes,
    },
    null,
    2,
  );

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Cache the stable instruction prefix; volatile facts go in the user turn.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Write the listing for these facts:\n\n${facts}`,
      },
    ],
    output_config: { format: jsonSchemaFormat("listing_copy", JSON_SCHEMA) },
  });

  const text = firstText(message);
  const parsed = text ? ListingCopySchema.safeParse(safeJson(text)) : null;
  if (!parsed || !parsed.success) {
    throw new ApiError("internal_error", "AI could not generate a listing");
  }
  return parsed.data;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
