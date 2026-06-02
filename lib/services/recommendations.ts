import type { DbClient } from "@/lib/db/client";
import { searchListings } from "@/lib/services/search";
import type { ListingSummary } from "@/lib/types/listing";
import type { PropertyType, TransactionType } from "@/lib/validation/common";
import { searchQuerySchema } from "@/lib/validation/search";

export interface SimilarSeed {
  id: string;
  transaction_type: TransactionType;
  property_type: PropertyType;
  price: number | null;
  city: string | null;
  pincode: string | null;
}

/**
 * Pure: build the search filters for "similar homes" — same category, same
 * city, and a ±30% price band. Unit-tested.
 */
export function buildSimilarFilters(seed: SimilarSeed): Record<string, unknown> {
  const filters: Record<string, unknown> = {
    transaction_type: seed.transaction_type,
    property_type: seed.property_type,
    sort: "newest",
    limit: 8,
  };
  if (seed.city) filters.city = seed.city;
  if (seed.price && seed.price > 0) {
    filters.price_min = Math.round(seed.price * 0.7);
    filters.price_max = Math.round(seed.price * 1.3);
  }
  return filters;
}

/** Listings comparable to the one being viewed (excludes the seed itself). */
export async function similarListings(
  supabase: DbClient,
  seed: SimilarSeed,
): Promise<ListingSummary[]> {
  try {
    const q = searchQuerySchema.parse(buildSimilarFilters(seed));
    const { items } = await searchListings(supabase, q);
    return items.filter((i) => i.id !== seed.id).slice(0, 6);
  } catch {
    return [];
  }
}

/**
 * "Homes you may like" — merges results from the user's saved searches.
 * Falls back to the newest listings when the user has no saved searches.
 */
export async function recommendedForUser(
  supabase: DbClient,
  userId: string,
): Promise<ListingSummary[]> {
  try {
    const { data } = await supabase
      .from("saved_searches")
      .select("filters")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const seen = new Set<string>();
    const out: ListingSummary[] = [];

    const runs = (data ?? []) as { filters: Record<string, string> }[];
    for (const row of runs) {
      const parsed = searchQuerySchema.safeParse({
        ...row.filters,
        limit: "6",
        sort: "newest",
      });
      if (!parsed.success) continue;
      const { items } = await searchListings(supabase, parsed.data);
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          out.push(item);
        }
      }
      if (out.length >= 8) break;
    }

    if (out.length === 0) {
      const { items } = await searchListings(
        supabase,
        searchQuerySchema.parse({ limit: "8", sort: "newest" }),
      );
      return items;
    }
    return out.slice(0, 8);
  } catch {
    return [];
  }
}
