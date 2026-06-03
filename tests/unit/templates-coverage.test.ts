import { describe, expect, it } from "vitest";

import {
  DEFAULT_FORM_TEMPLATES,
  findDefaultTemplate,
  validateAttributes,
} from "@/lib/services/form-templates";
import type { PropertyType, TransactionType } from "@/lib/validation/common";

/** Every combination the listing wizard can offer must have a template. */
const VALID: Record<TransactionType, PropertyType[]> = {
  rent: ["flat", "house", "commercial", "land"],
  lease: ["flat", "house", "commercial", "land"],
  coliving: ["flat", "house"],
  sale: ["flat", "house", "land", "commercial"],
};

describe("form template coverage", () => {
  it("has a default template for every valid transaction × property combo", () => {
    for (const [tx, props] of Object.entries(VALID)) {
      for (const prop of props) {
        const t = findDefaultTemplate(tx as TransactionType, prop);
        expect(t, `${tx} + ${prop}`).not.toBeNull();
        expect(t!.fields.length).toBeGreaterThan(0);
      }
    }
  });

  it("declares a price field on every template", () => {
    for (const t of DEFAULT_FORM_TEMPLATES) {
      expect(
        t.fields.some((f) => f.key === "price"),
        `${t.transaction_type} + ${t.property_type}`,
      ).toBe(true);
    }
  });

  it("enforces required fields at publish time", () => {
    const saleHouse = findDefaultTemplate("sale", "house")!;
    expect(() => validateAttributes(saleHouse, {})).toThrow();
    // A complete-enough payload validates.
    const ok = validateAttributes(saleHouse, {
      price: 9000000,
      ownership: "freehold",
      area_sqft: 1800,
      bhk: 3,
    });
    expect(ok.price).toBe(9000000);
  });

  it("accepts commercial as a property type", () => {
    expect(findDefaultTemplate("rent", "commercial")).not.toBeNull();
    expect(findDefaultTemplate("sale", "commercial")).not.toBeNull();
  });
});
