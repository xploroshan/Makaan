/**
 * Pure market-insight aggregations computed from Dwello's own active inventory.
 * Honest, transparent numbers (no third-party data) — unit-tested.
 */

export interface InsightRow {
  price: number | null;
  area_sqft: number | null;
  bhk: number | null;
  transaction_type: string;
  created_at: string;
}

export interface AreaStats {
  count: number;
  avgPrice: number | null;
  medianPrice: number | null;
  avgPricePerSqft: number | null;
  bhkDistribution: { bhk: number; count: number }[];
  byTransaction: {
    transaction_type: string;
    count: number;
    avgPrice: number | null;
  }[];
}

export interface TrendPoint {
  month: string;
  avg: number;
  count: number;
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const round = (n: number | null): number | null =>
  n == null ? null : Math.round(n);

export function summariseInsights(rows: InsightRow[]): AreaStats {
  const prices = rows
    .map((r) => r.price)
    .filter((p): p is number => p != null && p > 0);

  const ppsf = rows
    .filter((r) => r.price != null && r.area_sqft != null && r.area_sqft > 0)
    .map((r) => (r.price as number) / (r.area_sqft as number));

  const bhkMap = new Map<number, number>();
  for (const r of rows) {
    if (r.bhk != null) bhkMap.set(r.bhk, (bhkMap.get(r.bhk) ?? 0) + 1);
  }
  const bhkDistribution = [...bhkMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bhk, count]) => ({ bhk, count }));

  const txPrices = new Map<string, number[]>();
  const txCount = new Map<string, number>();
  for (const r of rows) {
    txCount.set(r.transaction_type, (txCount.get(r.transaction_type) ?? 0) + 1);
    if (r.price != null && r.price > 0) {
      const arr = txPrices.get(r.transaction_type) ?? [];
      arr.push(r.price);
      txPrices.set(r.transaction_type, arr);
    }
  }
  const byTransaction = [...txCount.entries()]
    .map(([transaction_type, count]) => ({
      transaction_type,
      count,
      avgPrice: round(mean(txPrices.get(transaction_type) ?? [])),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    count: rows.length,
    avgPrice: round(mean(prices)),
    medianPrice: round(median(prices)),
    avgPricePerSqft: round(mean(ppsf)),
    bhkDistribution,
    byTransaction,
  };
}

export function monthlyTrend(rows: InsightRow[], months = 12): TrendPoint[] {
  const map = new Map<string, number[]>();
  for (const r of rows) {
    if (r.price == null || r.price <= 0) continue;
    const month = r.created_at.slice(0, 7); // YYYY-MM
    const arr = map.get(month) ?? [];
    arr.push(r.price);
    map.set(month, arr);
  }
  return [...map.entries()]
    .map(([month, prices]) => ({
      month,
      avg: Math.round(prices.reduce((s, n) => s + n, 0) / prices.length),
      count: prices.length,
    }))
    .sort((a, b) => (a.month < b.month ? -1 : 1))
    .slice(-months);
}
