import { describe, expect, it } from "vitest";

import { coerceParsedFilters } from "@/lib/ai/coerce";

describe("coerceParsedFilters", () => {
  it("maps a typical parsed query into clean params", () => {
    const out = coerceParsedFilters({
      transaction_type: "rent",
      property_type: "flat",
      bhk: 2,
      price_max: 30000,
      city: "Pune",
      q: "near metro",
    });
    expect(out).toEqual({
      transaction_type: "rent",
      property_type: "flat",
      bhk: "2",
      price_max: "30000",
      city: "Pune",
      q: "near metro",
    });
  });

  it("drops nulls and empty strings", () => {
    const out = coerceParsedFilters({
      transaction_type: null,
      property_type: null,
      city: "  ",
      q: null,
    });
    expect(out).toEqual({});
  });

  it("clamps bhk and rounds money", () => {
    const out = coerceParsedFilters({ bhk: 99, price_min: 19999.6 });
    expect(out.bhk).toBe("20");
    expect(out.price_min).toBe("20000");
  });

  it("drops an inverted price range", () => {
    const out = coerceParsedFilters({ price_min: 50000, price_max: 10000 });
    expect(out.price_min).toBeUndefined();
    expect(out.price_max).toBeUndefined();
  });

  it("rejects a malformed pincode but keeps a valid one", () => {
    expect(coerceParsedFilters({ pincode: "12" }).pincode).toBeUndefined();
    expect(coerceParsedFilters({ pincode: "560034" }).pincode).toBe("560034");
  });
});
