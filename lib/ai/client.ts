import Anthropic from "@anthropic-ai/sdk";

/**
 * Shared Anthropic client for AI-assisted features (Phase 2).
 * Server-only. Returns null when no API key is configured so callers can
 * degrade gracefully instead of throwing at import time.
 */
let cached: Anthropic | null | undefined;

export function getAnthropic(): Anthropic | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  cached = apiKey ? new Anthropic({ apiKey }) : null;
  return cached;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Default model for AI features (see the claude-api skill: default to Opus). */
export const AI_MODEL = "claude-opus-4-8";
