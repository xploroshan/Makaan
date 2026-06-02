import type Anthropic from "@anthropic-ai/sdk";

/**
 * Structured-output format descriptor. We hand-write JSON Schemas (rather than
 * the SDK's Zod-v4 helper, since this project is on Zod v3) and validate the
 * model's JSON with our existing Zod v3 schemas after the fact.
 */
export function jsonSchemaFormat(
  name: string,
  schema: Record<string, unknown>,
) {
  return { type: "json_schema" as const, name, schema };
}

/** Pull the first text block out of a Messages response. */
export function firstText(message: Anthropic.Message): string | null {
  for (const block of message.content) {
    if (block.type === "text") return block.text;
  }
  return null;
}
