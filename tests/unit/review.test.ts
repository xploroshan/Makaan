import { describe, expect, it } from "vitest";

import { userReviewSchema } from "@/lib/validation/review";

describe("userReviewSchema", () => {
  it("accepts a valid rating and bounds it", () => {
    expect(userReviewSchema.safeParse({ rating: 5 }).success).toBe(true);
    expect(userReviewSchema.safeParse({ rating: 0 }).success).toBe(false);
    expect(userReviewSchema.safeParse({ rating: 6 }).success).toBe(false);
  });

  it("coerces string ratings and allows optional text", () => {
    const parsed = userReviewSchema.parse({ rating: "4", text: "Great owner" });
    expect(parsed.rating).toBe(4);
    expect(parsed.text).toBe("Great owner");
  });
});
