import { describe, expect, it } from "vitest";

import { affordableRent, emi, totalPayable } from "@/lib/finance";

describe("emi", () => {
  it("matches the standard amortisation formula", () => {
    // ₹10,00,000 at 12% p.a. over 12 months ≈ ₹88,849/month.
    expect(Math.round(emi(1_000_000, 12, 12))).toBe(88849);
  });

  it("splits principal evenly at 0% interest", () => {
    expect(emi(1_200_000, 0, 12)).toBe(100_000);
  });

  it("returns 0 for non-positive inputs", () => {
    expect(emi(0, 8.5, 240)).toBe(0);
    expect(emi(1_000_000, 8.5, 0)).toBe(0);
  });

  it("total payable is emi times months", () => {
    const m = emi(5_000_000, 8.5, 240);
    expect(totalPayable(m, 240)).toBeCloseTo(m * 240);
  });
});

describe("affordableRent", () => {
  it("recommends 30% and caps at 40% of income", () => {
    expect(affordableRent(100_000)).toEqual({
      recommended: 30_000,
      ceiling: 40_000,
    });
  });

  it("never goes negative", () => {
    expect(affordableRent(-5)).toEqual({ recommended: 0, ceiling: 0 });
  });
});
