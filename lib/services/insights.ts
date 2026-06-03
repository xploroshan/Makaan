import type { DbClient } from "@/lib/db/client";
import {
  monthlyTrend,
  summariseInsights,
  type AreaStats,
  type InsightRow,
  type TrendPoint,
} from "@/lib/insights";
import type { InsightsQuery } from "@/lib/validation/insights";

export interface AreaInsights {
  city: string | null;
  locality: string | null;
  transaction_type: string | null;
  stats: AreaStats;
  trend: TrendPoint[];
  topLocalities: { locality: string; count: number }[];
}

type Row = InsightRow & {
  locations:
    | { city: string | null; locality: string | null }
    | { city: string | null; locality: string | null }[]
    | null;
};

/** Market insights for an area, derived from active listings. */
export async function getAreaInsights(
  supabase: DbClient,
  filters: InsightsQuery,
): Promise<AreaInsights> {
  let query = supabase
    .from("listings")
    .select(
      "price, area_sqft, bhk, transaction_type, created_at, " +
        "locations!inner(city, locality)",
    )
    .eq("status", "active")
    .limit(2000);

  if (filters.transaction_type)
    query = query.eq("transaction_type", filters.transaction_type);
  if (filters.city) query = query.ilike("locations.city", `%${filters.city}%`);
  if (filters.locality)
    query = query.ilike("locations.locality", `%${filters.locality}%`);

  const { data, error } = await query;
  if (error) throw error;

  const raw = (data ?? []) as unknown as Row[];
  const rows: InsightRow[] = raw.map((r) => ({
    price: r.price,
    area_sqft: r.area_sqft,
    bhk: r.bhk,
    transaction_type: r.transaction_type,
    created_at: r.created_at,
  }));

  const locMap = new Map<string, number>();
  for (const r of raw) {
    const loc = Array.isArray(r.locations) ? r.locations[0] : r.locations;
    if (loc?.locality) locMap.set(loc.locality, (locMap.get(loc.locality) ?? 0) + 1);
  }
  const topLocalities = [...locMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([locality, count]) => ({ locality, count }));

  return {
    city: filters.city ?? null,
    locality: filters.locality ?? null,
    transaction_type: filters.transaction_type ?? null,
    stats: summariseInsights(rows),
    trend: monthlyTrend(rows),
    topLocalities,
  };
}
