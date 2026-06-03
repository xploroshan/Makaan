import type { DbClient } from "@/lib/db/client";
import {
  SUMMARY_SELECT,
  toSummary,
  type SummaryRow,
} from "@/lib/services/search";
import type { ListingSummary } from "@/lib/types/listing";

/** Add a listing to the caller's saved homes (idempotent). */
export async function addToShortlist(
  supabase: DbClient,
  userId: string,
  listingId: string,
): Promise<{ listing_id: string }> {
  const { error } = await supabase
    .from("shortlists")
    .upsert(
      { user_id: userId, listing_id: listingId },
      { onConflict: "user_id,listing_id" },
    );
  if (error) throw error;
  return { listing_id: listingId };
}

export async function removeFromShortlist(
  supabase: DbClient,
  userId: string,
  listingId: string,
): Promise<{ listing_id: string }> {
  const { error } = await supabase
    .from("shortlists")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);
  if (error) throw error;
  return { listing_id: listingId };
}

/** Just the saved listing IDs — powers the heart state across the app. */
export async function listShortlistIds(
  supabase: DbClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("shortlists")
    .select("listing_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as { listing_id: string }[]).map((r) => r.listing_id);
}

/** Full saved homes as listing summaries (newest first). */
export async function listShortlist(
  supabase: DbClient,
  userId: string,
): Promise<ListingSummary[]> {
  const { data, error } = await supabase
    .from("shortlists")
    .select(`created_at, listings!inner(${SUMMARY_SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    listings: SummaryRow | SummaryRow[] | null;
  }[];

  return rows
    .map((r) => (Array.isArray(r.listings) ? r.listings[0] : r.listings))
    .filter((l): l is SummaryRow => Boolean(l))
    .map(toSummary);
}
