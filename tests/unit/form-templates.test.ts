import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  findDefaultTemplate,
  validateAttributes,
} from "@/lib/services/form-templates";

describe("form templates", () => {
  it("provides a land template with registration fields", () => {
    const tpl = findDefaultTemplate("sale", "land");
    expect(tpl).not.toBeNull();
    const keys = tpl!.fields.map((f) => f.key);
    expect(keys).toContain("survey_no");
    expect(keys).toContain("land_type");
  });

  it("validates rent attributes and coerces numbers", () => {
    const tpl = findDefaultTemplate("rent", "flat")!;
    const parsed = validateAttributes(tpl, {
      price: "25000",
      deposit: "50000",
      furnishing: "semi",
      bhk: "2",
      area_sqft: "950",
      available_from: "2026-07-01",
    });
    expect(parsed.price).toBe(25000);
    expect(parsed.bhk).toBe(2);
  });

  it("rejects when a required field is missing (publish)", () => {
    const tpl = findDefaultTemplate("rent", "flat")!;
    expect(() => validateAttributes(tpl, { price: 1000 })).toThrowError(
      ApiError,
    );
  });

  it("allows missing required fields in partial (draft) mode", () => {
    const tpl = findDefaultTemplate("rent", "flat")!;
    expect(() =>
      validateAttributes(tpl, { price: 1000 }, { partial: true }),
    ).not.toThrow();
  });

  it("rejects an invalid enum value", () => {
    const tpl = findDefaultTemplate("rent", "flat")!;
    expect(() =>
      validateAttributes(tpl, { furnishing: "gold-plated" }, { partial: true }),
    ).toThrowError(ApiError);
  });
});
