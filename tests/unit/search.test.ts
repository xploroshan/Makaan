import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor } from "@/lib/api/cursor";
import { buildSort, supportsCursor } from "@/lib/services/search";
import { searchQuerySchema } from "@/lib/validation/search";

describe("search sort", () => {
  it("maps sort options to order clauses", () => {
    expect(buildSort("price_asc")).toEqual({
      column: "price",
      ascending: true,
    });
    expect(buildSort("price_desc")).toEqual({
      column: "price",
      ascending: false,
    });
    expect(buildSort("newest")).toEqual({
      column: "created_at",
      ascending: false,
    });
  });

  it("only supports keyset cursors for recency-based sorts", () => {
    expect(supportsCursor("newest")).toBe(true);
    expect(supportsCursor("relevance")).toBe(true);
    expect(supportsCursor("price_asc")).toBe(false);
  });
});

describe("cursor", () => {
  it("round-trips", () => {
    const c = { ts: "2026-06-02T00:00:00.000Z", id: "abc" };
    expect(decodeCursor(encodeCursor(c))).toEqual(c);
  });
  it("returns null for garbage", () => {
    expect(decodeCursor("not-base64!!")).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
  });
});

describe("search query schema", () => {
  it("requires lat and lng together", () => {
    expect(searchQuerySchema.safeParse({ lat: "12.9" }).success).toBe(false);
    expect(
      searchQuerySchema.safeParse({ lat: "12.9", lng: "77.6" }).success,
    ).toBe(true);
  });

  it("enforces price_min <= price_max", () => {
    expect(
      searchQuerySchema.safeParse({ price_min: "100", price_max: "50" })
        .success,
    ).toBe(false);
  });

  it("defaults sort and limit", () => {
    const parsed = searchQuerySchema.parse({});
    expect(parsed.sort).toBe("newest");
    expect(parsed.limit).toBe(20);
  });
});
