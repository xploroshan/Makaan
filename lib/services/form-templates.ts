import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type { FormTemplate, TemplateField } from "@/lib/types/listing";
import type { PropertyType, TransactionType } from "@/lib/validation/common";

/**
 * Built-in defaults that mirror `supabase/seed/seed.sql`. They are the
 * fallback when the DB has no template yet, so the listing wizard works
 * out of the box. The Super Admin console can override these at runtime
 * (stored in `form_templates`), which always take precedence.
 */
export const DEFAULT_FORM_TEMPLATES: FormTemplate[] = [
  {
    transaction_type: "rent",
    property_type: "flat",
    version: 1,
    validations: {
      required: [
        "price",
        "deposit",
        "furnishing",
        "bhk",
        "area_sqft",
        "available_from",
      ],
    },
    fields: [
      { key: "price", label: "Monthly rent", type: "currency", required: true },
      {
        key: "deposit",
        label: "Security deposit",
        type: "currency",
        required: true,
      },
      { key: "maintenance", label: "Maintenance / month", type: "currency" },
      {
        key: "furnishing",
        label: "Furnishing",
        type: "enum",
        required: true,
        options: ["unfurnished", "semi", "full"],
      },
      { key: "bhk", label: "BHK", type: "number", required: true },
      {
        key: "area_sqft",
        label: "Built-up area (sq ft)",
        type: "number",
        required: true,
      },
      { key: "floor", label: "Floor", type: "number" },
      {
        key: "available_from",
        label: "Available from",
        type: "date",
        required: true,
      },
      {
        key: "preferred_tenant",
        label: "Preferred tenant",
        type: "enum",
        options: ["family", "bachelors", "company", "any"],
      },
      { key: "amenities", label: "Amenities", type: "multiselect" },
      { key: "lock_in", label: "Lock-in (months)", type: "number" },
      { key: "notice_period", label: "Notice period (months)", type: "number" },
    ],
  },
  {
    transaction_type: "lease",
    property_type: "flat",
    version: 1,
    validations: { required: ["price", "lease_duration", "bhk", "area_sqft"] },
    fields: [
      { key: "price", label: "Lease amount", type: "currency", required: true },
      {
        key: "lease_duration",
        label: "Lease duration (months)",
        type: "number",
        required: true,
      },
      { key: "refundable", label: "Refundable amount", type: "currency" },
      {
        key: "furnishing",
        label: "Furnishing",
        type: "enum",
        options: ["unfurnished", "semi", "full"],
      },
      { key: "bhk", label: "BHK", type: "number", required: true },
      {
        key: "area_sqft",
        label: "Built-up area (sq ft)",
        type: "number",
        required: true,
      },
      { key: "conditions", label: "Conditions", type: "text" },
    ],
  },
  {
    transaction_type: "coliving",
    property_type: "flat",
    version: 1,
    validations: { required: ["price", "sharing"] },
    fields: [
      {
        key: "price",
        label: "Price per bed / room",
        type: "currency",
        required: true,
      },
      {
        key: "sharing",
        label: "Sharing type",
        type: "enum",
        required: true,
        options: ["private", "double", "triple", "dorm"],
      },
      {
        key: "gender_pref",
        label: "Gender preference",
        type: "enum",
        options: ["any", "male", "female"],
      },
      { key: "food_included", label: "Food included", type: "boolean" },
      { key: "deposit", label: "Deposit", type: "currency" },
      { key: "house_rules", label: "House rules", type: "text" },
      { key: "amenities", label: "Amenities", type: "multiselect" },
    ],
  },
  {
    transaction_type: "sale",
    property_type: "flat",
    version: 1,
    validations: { required: ["price", "ownership", "area_sqft"] },
    fields: [
      {
        key: "price",
        label: "Expected price",
        type: "currency",
        required: true,
      },
      { key: "negotiable", label: "Negotiable", type: "boolean" },
      {
        key: "ownership",
        label: "Ownership",
        type: "enum",
        required: true,
        options: ["freehold", "leasehold"],
      },
      { key: "age", label: "Property age (years)", type: "number" },
      {
        key: "area_sqft",
        label: "Built-up area (sq ft)",
        type: "number",
        required: true,
      },
      { key: "floor", label: "Floor", type: "number" },
      {
        key: "facing",
        label: "Facing",
        type: "enum",
        options: ["N", "S", "E", "W", "NE", "NW", "SE", "SW"],
      },
      { key: "parking", label: "Parking", type: "number" },
      { key: "approvals", label: "Approvals (RERA etc.)", type: "text" },
      { key: "loan_available", label: "Loan available", type: "boolean" },
      {
        key: "possession",
        label: "Possession status",
        type: "enum",
        options: ["ready", "under_construction"],
      },
    ],
  },
  {
    transaction_type: "sale",
    property_type: "land",
    version: 1,
    validations: { required: ["price", "area_sqft", "land_type", "survey_no"] },
    fields: [
      {
        key: "price",
        label: "Price (total)",
        type: "currency",
        required: true,
      },
      {
        key: "price_per_unit",
        label: "Price per sq ft / unit",
        type: "currency",
      },
      {
        key: "area_sqft",
        label: "Plot area (sq ft)",
        type: "number",
        required: true,
      },
      { key: "dimensions", label: "Plot dimensions", type: "text" },
      {
        key: "land_type",
        label: "Land type",
        type: "enum",
        required: true,
        options: ["residential", "agricultural", "commercial", "industrial"],
      },
      { key: "road_width", label: "Road width (ft)", type: "number" },
      { key: "corner_plot", label: "Corner plot", type: "boolean" },
      {
        key: "boundary",
        label: "Boundary / fencing",
        type: "enum",
        options: ["none", "partial", "full"],
      },
      { key: "approvals", label: "Approvals (RERA / khata)", type: "text" },
      {
        key: "survey_no",
        label: "Survey / khata number",
        type: "text",
        required: true,
      },
      {
        key: "registration_office",
        label: "Registration sub-office",
        type: "text",
      },
      {
        key: "guideline_value",
        label: "Guideline / circle value",
        type: "currency",
      },
      {
        key: "encumbrance",
        label: "Encumbrance status",
        type: "enum",
        options: ["clear", "encumbered"],
      },
    ],
  },
];

/** Find the default template for a category combination. */
export function findDefaultTemplate(
  transaction: TransactionType,
  property: PropertyType,
): FormTemplate | null {
  return (
    DEFAULT_FORM_TEMPLATES.find(
      (t) => t.transaction_type === transaction && t.property_type === property,
    ) ?? null
  );
}

/**
 * Resolve the active template for a category: a Super Admin override from the
 * `form_templates` table if present (highest enabled version), otherwise the
 * built-in default. This is what the wizard and validation should always use.
 */
export async function resolveTemplate(
  supabase: DbClient,
  transaction: TransactionType,
  property: PropertyType,
): Promise<FormTemplate | null> {
  const { data } = await supabase
    .from("form_templates")
    .select("transaction_type, property_type, version, fields, validations")
    .eq("transaction_type", transaction)
    .eq("property_type", property)
    .eq("enabled", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return data as FormTemplate;
  return findDefaultTemplate(transaction, property);
}

/**
 * Build a Zod schema from a template's field definitions.
 * With `{ partial: true }` every field is optional — used when saving a
 * draft, where required fields are only enforced at publish time.
 */
export function zodSchemaForTemplate(
  template: FormTemplate,
  options: { partial?: boolean } = {},
): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  const required = new Set(template.validations?.required ?? []);

  for (const field of template.fields) {
    let schema = zodForField(field);
    const isRequired =
      !options.partial && (field.required || required.has(field.key));
    if (!isRequired) schema = schema.optional();
    shape[field.key] = schema;
  }
  // Allow unknown keys but drop them from the output.
  return z.object(shape).strip();
}

function zodForField(field: TemplateField): z.ZodTypeAny {
  switch (field.type) {
    case "currency":
      return z.coerce.number().nonnegative();
    case "number":
      return z.coerce.number();
    case "boolean":
      return z.coerce.boolean();
    case "date":
      return z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Expected a date");
    case "enum":
      return field.options?.length
        ? z.enum(field.options as [string, ...string[]])
        : z.string();
    case "multiselect":
      return z.array(z.string());
    case "text":
    default:
      return z.string();
  }
}

/**
 * Validate a category attributes object against its template.
 * Throws ApiError.validation on failure; returns the parsed attributes.
 */
export function validateAttributes(
  template: FormTemplate,
  attributes: unknown,
  options: { partial?: boolean } = {},
): Record<string, unknown> {
  const result = zodSchemaForTemplate(template, options).safeParse(
    attributes ?? {},
  );
  if (!result.success) {
    throw ApiError.validation(
      "Listing attributes failed validation",
      result.error.flatten(),
    );
  }
  return result.data as Record<string, unknown>;
}
