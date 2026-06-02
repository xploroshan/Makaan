import { describe, expect, it } from "vitest";

import {
  buildMatchNotification,
  createSavedSearchSchema,
} from "@/lib/validation/alerts";

describe("buildMatchNotification", () => {
  it("uses singular/plural and a deep link", () => {
    const one = buildMatchNotification("Pune rentals", 1, {
      transaction_type: "rent",
      city: "Pune",
    });
    expect(one.title).toBe("1 new home for Pune rentals");
    expect(one.url).toContain("/search?");
    expect(one.url).toContain("transaction_type=rent");

    const many = buildMatchNotification(null, 3, {});
    expect(many.title).toBe("3 new homes for your saved search");
    expect(many.url).toBe("/search");
  });
});

describe("createSavedSearchSchema", () => {
  it("defaults channel/frequency and accepts string filters", () => {
    const parsed = createSavedSearchSchema.parse({
      filters: { transaction_type: "rent", bhk: "2" },
    });
    expect(parsed.alert_channel).toBe("in_app");
    expect(parsed.frequency).toBe("instant");
    expect(parsed.filters.bhk).toBe("2");
  });

  it("rejects an invalid channel", () => {
    expect(
      createSavedSearchSchema.safeParse({ filters: {}, alert_channel: "fax" })
        .success,
    ).toBe(false);
  });
});
