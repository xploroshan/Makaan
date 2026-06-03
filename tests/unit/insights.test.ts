import { describe, expect, it } from "vitest";

import {
  monthlyTrend,
  summariseInsights,
  type InsightRow,
} from "@/lib/insights";

const rows: InsightRow[] = [
  { price: 20000, area_sqft: 1000, bhk: 2, transaction_type: "rent", created_at: "2026-01-10" },
  { price: 30000, area_sqft: 1500, bhk: 3, transaction_type: "rent", created_at: "2026-02-15" },
  { price: 25000, area_sqft: 1000, bhk: 2, transaction_type: "rent", created_at: "2026-02-20" },
  { price: 5000000, area_sqft: 1200, bhk: 2, transaction_type: "sale", created_at: "2026-02-01" },
  { price: null, area_sqft: null, bhk: 1, transaction_type: "rent", created_at: "2026-03-01" },
];

describe("summariseInsights", () => {
  it("counts everything but averages only priced rows", () => {
    const s = summariseInsights(rows);
    expect(s.count).toBe(5);
    // rent+sale priced = 20000,30000,25000,5000000 -> mean rounded
    expect(s.avgPrice).toBe(Math.round((20000 + 30000 + 25000 + 5000000) / 4));
    expect(s.medianPrice).toBe(Math.round((30000 + 25000) / 2));
  });

  it("computes price per sqft from rows with both fields", () => {
    const s = summariseInsights(rows);
    // 20, 20, 25, ~4166.67 -> mean rounded
    expect(s.avgPricePerSqft).toBe(
      Math.round((20 + 20 + 25 + 5000000 / 1200) / 4),
    );
  });

  it("buckets BHK and breaks down by transaction", () => {
    const s = summariseInsights(rows);
    expect(s.bhkDistribution).toEqual([
      { bhk: 1, count: 1 },
      { bhk: 2, count: 3 },
      { bhk: 3, count: 1 },
    ]);
    const rent = s.byTransaction.find((t) => t.transaction_type === "rent");
    expect(rent?.count).toBe(4); // includes the price-less rent row
    expect(rent?.avgPrice).toBe(Math.round((20000 + 30000 + 25000) / 3));
  });
});

describe("monthlyTrend", () => {
  it("groups priced rows by month, chronologically", () => {
    const t = monthlyTrend(rows);
    expect(t.map((p) => p.month)).toEqual(["2026-01", "2026-02"]);
    expect(t[0]).toEqual({ month: "2026-01", avg: 20000, count: 1 });
    expect(t[1].count).toBe(3);
  });
});
