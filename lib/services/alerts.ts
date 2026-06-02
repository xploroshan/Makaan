import type { DbClient } from "@/lib/db/client";
import { searchListings } from "@/lib/services/search";
import {
  buildMatchNotification,
  type CreateSavedSearchInput,
} from "@/lib/validation/alerts";
import { searchQuerySchema } from "@/lib/validation/search";

export interface SavedSearch {
  id: string;
  name: string | null;
  filters: Record<string, string>;
  alert_channel: string;
  frequency: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

const SS_COLUMNS = "id, name, filters, alert_channel, frequency, created_at";

export async function createSavedSearch(
  supabase: DbClient,
  userId: string,
  input: CreateSavedSearchInput,
): Promise<SavedSearch> {
  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      user_id: userId,
      name: input.name ?? null,
      filters: input.filters,
      alert_channel: input.alert_channel,
      frequency: input.frequency,
    })
    .select(SS_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as SavedSearch;
}

export async function listSavedSearches(
  supabase: DbClient,
  userId: string,
): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from("saved_searches")
    .select(SS_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SavedSearch[];
}

export async function deleteSavedSearch(
  supabase: DbClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("saved_searches").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Check every saved search for listings published since the last check and
 * create an in-app notification per search that has new matches. Runs lazily
 * when the user opens their notifications, so no cron is required.
 */
export async function runSavedSearchMatches(
  supabase: DbClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, name, filters, last_notified_at")
    .eq("user_id", userId);
  if (error || !data) return;

  for (const row of data as {
    id: string;
    name: string | null;
    filters: Record<string, string>;
    last_notified_at: string;
  }[]) {
    const parsed = searchQuerySchema.safeParse(row.filters ?? {});
    if (!parsed.success) continue;

    const checkedAt = new Date().toISOString();
    let items: { id: string }[] = [];
    try {
      const res = await searchListings(supabase, parsed.data, {
        since: row.last_notified_at,
      });
      items = res.items;
    } catch {
      continue;
    }

    if (items.length > 0) {
      const note = buildMatchNotification(row.name, items.length, row.filters);
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "saved_search_match",
        title: note.title,
        url: note.url,
      });
    }
    // Advance the watermark whether or not there were matches.
    await supabase
      .from("saved_searches")
      .update({ last_notified_at: checkedAt })
      .eq("id", row.id);
  }
}

export async function listNotifications(
  supabase: DbClient,
  userId: string,
): Promise<{ items: Notification[]; unread: number }> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, url, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  const items = (data ?? []) as unknown as Notification[];
  return { items, unread: items.filter((n) => !n.read_at).length };
}

export async function markAllRead(
  supabase: DbClient,
  userId: string,
): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
