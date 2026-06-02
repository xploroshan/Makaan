import { decodeCursor, encodeCursor } from "@/lib/api/cursor";
import type { DbClient } from "@/lib/db/client";
import type { ListingSummary } from "@/lib/types/listing";
import {
  isGeoSearch,
  type SearchQuery,
  type SortOption,
} from "@/lib/validation/search";

const DEFAULT_RADIUS_M = 5000;

export interface SearchResult {
  items: ListingSummary[];
  nextCursor: string | null;
}

/** Pure mapping from a sort option to a Postgres order clause. Unit-tested. */
export function buildSort(sort: SortOption): {
  column: string;
  ascending: boolean;
} {
  switch (sort) {
    case "price_asc":
      return { column: "price", ascending: true };
    case "price_desc":
      return { column: "price", ascending: false };
    case "relevance":
    case "newest":
    default:
      // Relevance ranking (text rank) is a P2 enhancement; default to recency.
      return { column: "created_at", ascending: false };
  }
}

/** Keyset pagination is only stable for the recency sort. */
export function supportsCursor(sort: SortOption): boolean {
  return sort === "newest" || sort === "relevance";
}

const SUMMARY_SELECT =
  "id, transaction_type, property_type, title, price, bhk, area_sqft, " +
  "furnishing, created_at, " +
  "locations!inner(locality, city, pincode), " +
  "media(url, sort_order)";

type SummaryRow = {
  id: string;
  transaction_type: ListingSummary["transaction_type"];
  property_type: ListingSummary["property_type"];
  title: string | null;
  price: number | null;
  bhk: number | null;
  area_sqft: number | null;
  furnishing: string | null;
  created_at: string;
  locations:
    | { locality: string | null; city: string | null; pincode: string | null }
    | { locality: string | null; city: string | null; pincode: string | null }[]
    | null;
  media: { url: string; sort_order: number }[] | null;
};

/** Run a faceted + geo + pincode search over active listings. */
export async function searchListings(
  supabase: DbClient,
  q: SearchQuery,
): Promise<SearchResult> {
  let query = supabase
    .from("listings")
    .select(SUMMARY_SELECT)
    .eq("status", "active");

  // --- facets ---
  if (q.transaction_type)
    query = query.eq("transaction_type", q.transaction_type);
  if (q.property_type) query = query.eq("property_type", q.property_type);
  if (q.bhk !== undefined) query = query.eq("bhk", q.bhk);
  if (q.furnishing) query = query.eq("furnishing", q.furnishing);
  if (q.price_min !== undefined) query = query.gte("price", q.price_min);
  if (q.price_max !== undefined) query = query.lte("price", q.price_max);

  // --- location scoping ---
  if (q.pincode) query = query.eq("locations.pincode", q.pincode);
  if (q.city) query = query.ilike("locations.city", `%${q.city}%`);

  // --- full-text ---
  if (q.q) {
    query = query.textSearch("search_tsv", q.q, {
      type: "websearch",
      config: "simple",
    });
  }

  // --- geospatial radius (PostGIS via RPC, then constrain) ---
  if (isGeoSearch(q)) {
    const radius = q.radius_m ?? DEFAULT_RADIUS_M;
    const { data: near, error } = await supabase
      .rpc("listings_within_radius", {
        lng: q.lng,
        lat: q.lat,
        radius_m: radius,
      })
      .select("id");
    if (error) throw error;
    const ids = ((near ?? []) as unknown as { id: string }[]).map((r) => r.id);
    if (ids.length === 0) return { items: [], nextCursor: null };
    query = query.in("id", ids);
  }

  // --- sort + keyset pagination ---
  const sort = buildSort(q.sort);
  const cursor = supportsCursor(q.sort) ? decodeCursor(q.cursor) : null;
  if (cursor) query = query.lt("created_at", cursor.ts);

  query = query
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(q.limit + 1);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as SummaryRow[];
  const hasMore = rows.length > q.limit;
  const page = hasMore ? rows.slice(0, q.limit) : rows;

  const items = page.map(toSummary);

  let nextCursor: string | null = null;
  if (hasMore && supportsCursor(q.sort)) {
    const last = page[page.length - 1];
    nextCursor = encodeCursor({ ts: last.created_at, id: last.id });
  }

  return { items, nextCursor };
}

function toSummary(row: SummaryRow): ListingSummary {
  const loc = Array.isArray(row.locations)
    ? (row.locations[0] ?? null)
    : row.locations;
  const cover =
    (row.media ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)[0]
      ?.url ?? null;

  return {
    id: row.id,
    transaction_type: row.transaction_type,
    property_type: row.property_type,
    title: row.title,
    price: row.price,
    bhk: row.bhk,
    area_sqft: row.area_sqft,
    furnishing: row.furnishing,
    locality: loc?.locality ?? null,
    city: loc?.city ?? null,
    pincode: loc?.pincode ?? null,
    cover_url: cover,
    created_at: row.created_at,
  };
}
