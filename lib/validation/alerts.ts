import { z } from "zod";

/** Body for creating a saved search + alert. `filters` mirror the /search params. */
export const createSavedSearchSchema = z.object({
  name: z.string().trim().max(80).optional(),
  filters: z.record(z.string(), z.string()).default({}),
  alert_channel: z
    .enum(["in_app", "email", "whatsapp", "none"])
    .default("in_app"),
  frequency: z.enum(["instant", "daily", "weekly"]).default("instant"),
});
export type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>;

/** Pure: human label + deep link for a "new matches" notification. */
export function buildMatchNotification(
  name: string | null,
  count: number,
  filters: Record<string, string>,
): { title: string; url: string } {
  const label = name?.trim() || "your saved search";
  const qs = new URLSearchParams(filters).toString();
  return {
    title: `${count} new ${count === 1 ? "home" : "homes"} for ${label}`,
    url: qs ? `/search?${qs}` : "/search",
  };
}
