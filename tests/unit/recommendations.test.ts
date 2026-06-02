import { describe, expect, it } from "vitest";

import {
  buildSimilarFilters,
  type SimilarSeed,
} from "@/lib/services/recommendations";

const seed: SimilarSeed = {
  id: "abc",
  transaction_type: "rent",
  property_type: "flat",
  price: 20000,
  city: "Pune",
  pincode: "411001",
};

describe("buildSimilarFilters", () => {
  it("keeps the same category and city", () => {
    const f = buildSimilarFilters(seed);
    expect(f.transaction_type).toBe("rent");
    expect(f.property_type).toBe("flat");
    expect(f.city).toBe("Pune");
    expect(f.sort).toBe("newest");
  });

  it("builds a ±30% price band", () => {
    const f = buildSimilarFilters(seed);
    expect(f.price_min).toBe(14000);
    expect(f.price_max).toBe(26000);
  });

  it("omits the price band when price is missing", () => {
    const f = buildSimilarFilters({ ...seed, price: null });
    expect(f.price_min).toBeUndefined();
    expect(f.price_max).toBeUndefined();
  });

  it("omits city when not provided", () => {
    const f = buildSimilarFilters({ ...seed, city: null });
    expect(f.city).toBeUndefined();
  });
});
