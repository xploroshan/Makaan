import { describe, expect, it } from "vitest";

import {
  pincode,
  transactionType,
  paginationQuery,
} from "@/lib/validation/common";

describe("validation primitives", () => {
  it("accepts valid Indian pincodes and rejects bad ones", () => {
    expect(pincode.safeParse("560034").success).toBe(true);
    expect(pincode.safeParse("012345").success).toBe(false);
    expect(pincode.safeParse("56003").success).toBe(false);
  });

  it("constrains transaction type to the known set", () => {
    expect(transactionType.safeParse("rent").success).toBe(true);
    expect(transactionType.safeParse("barter").success).toBe(false);
  });

  it("coerces and bounds pagination", () => {
    const parsed = paginationQuery.parse({ limit: "10" });
    expect(parsed.limit).toBe(10);
    expect(paginationQuery.parse({}).limit).toBe(20);
    expect(paginationQuery.safeParse({ limit: "999" }).success).toBe(false);
  });
});
