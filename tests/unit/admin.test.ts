import { describe, expect, it } from "vitest";

import {
  configAdminSchema,
  formTemplateAdminSchema,
  geoAdminSchema,
  moderateListingSchema,
  userAdminSchema,
} from "@/lib/validation/admin";

describe("admin validation", () => {
  it("requires status or roles when updating a user", () => {
    expect(userAdminSchema.safeParse({}).success).toBe(false);
    expect(userAdminSchema.safeParse({ status: "banned" }).success).toBe(true);
    expect(userAdminSchema.safeParse({ roles: ["agent"] }).success).toBe(true);
  });

  it("constrains moderation actions", () => {
    expect(moderateListingSchema.safeParse({ action: "approve" }).success).toBe(
      true,
    );
    expect(moderateListingSchema.safeParse({ action: "nuke" }).success).toBe(
      false,
    );
  });

  it("validates a form template and defaults version/enabled", () => {
    const parsed = formTemplateAdminSchema.parse({
      transaction_type: "rent",
      property_type: "flat",
      fields: [
        { key: "price", label: "Rent", type: "currency", required: true },
      ],
    });
    expect(parsed.version).toBe(1);
    expect(parsed.enabled).toBe(true);
  });

  it("rejects a bad field type in a template", () => {
    expect(
      formTemplateAdminSchema.safeParse({
        transaction_type: "rent",
        property_type: "flat",
        fields: [{ key: "x", label: "X", type: "rocket" }],
      }).success,
    ).toBe(false);
  });

  it("defaults config scope and accepts arbitrary JSON values", () => {
    const parsed = configAdminSchema.parse({ key: "feature.x", value: true });
    expect(parsed.scope).toBe("global");
    expect(parsed.enabled).toBe(true);
  });

  it("validates a pincode in geo input", () => {
    expect(
      geoAdminSchema.safeParse({ city: "Pune", pincode: "411001" }).success,
    ).toBe(true);
    expect(
      geoAdminSchema.safeParse({ city: "Pune", pincode: "41" }).success,
    ).toBe(false);
  });
});
