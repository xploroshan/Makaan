import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type { FormTemplate, TemplateField } from "@/lib/types/listing";
import type { PropertyType, TransactionType } from "@/lib/validation/common";

// ---------------------------------------------------------------------------
// Reusable field definitions. Keys map to listing columns where they exist
// (price, deposit, area_sqft, bhk, furnishing, available_from); everything else
// is stored in the listing's `attributes` JSONB.
// ---------------------------------------------------------------------------
const price = (label: string): TemplateField => ({
  key: "price",
  label,
  type: "currency",
  required: true,
});

const DEPOSIT: TemplateField = {
  key: "deposit",
  label: "Security deposit",
  type: "currency",
  required: true,
};
const MAINTENANCE: TemplateField = {
  key: "maintenance",
  label: "Maintenance / month",
  type: "currency",
};
const FURNISHING: TemplateField = {
  key: "furnishing",
  label: "Furnishing",
  type: "enum",
  options: ["unfurnished", "semi", "full"],
};
const FURNISHING_REQ: TemplateField = { ...FURNISHING, required: true };
const BHK: TemplateField = {
  key: "bhk",
  label: "Bedrooms (BHK)",
  type: "number",
  required: true,
};
const BUILTUP: TemplateField = {
  key: "area_sqft",
  label: "Built-up area (sq ft)",
  type: "number",
  required: true,
};
const CARPET: TemplateField = {
  key: "carpet_area",
  label: "Carpet area (sq ft)",
  type: "number",
};
const FLOOR: TemplateField = { key: "floor", label: "Floor", type: "number" };
const TOTAL_FLOORS: TemplateField = {
  key: "total_floors",
  label: "Total floors",
  type: "number",
};
const BATHROOMS: TemplateField = {
  key: "bathrooms",
  label: "Bathrooms",
  type: "number",
};
const BALCONIES: TemplateField = {
  key: "balconies",
  label: "Balconies",
  type: "number",
};
const FACING: TemplateField = {
  key: "facing",
  label: "Facing",
  type: "enum",
  options: ["N", "S", "E", "W", "NE", "NW", "SE", "SW"],
};
const PARKING: TemplateField = {
  key: "parking",
  label: "Parking (count)",
  type: "number",
};
const AGE: TemplateField = {
  key: "age",
  label: "Property age (years)",
  type: "number",
};
const AVAILABLE_FROM: TemplateField = {
  key: "available_from",
  label: "Available from",
  type: "date",
  required: true,
};
const PREFERRED_TENANT: TemplateField = {
  key: "preferred_tenant",
  label: "Preferred tenant",
  type: "enum",
  options: ["family", "bachelors", "company", "any"],
};
const LOCK_IN: TemplateField = {
  key: "lock_in",
  label: "Lock-in (months)",
  type: "number",
};
const NOTICE: TemplateField = {
  key: "notice_period",
  label: "Notice period (months)",
  type: "number",
};
const LEASE_DURATION: TemplateField = {
  key: "lease_duration",
  label: "Lease duration (months)",
  type: "number",
  required: true,
};
const REFUNDABLE: TemplateField = {
  key: "refundable",
  label: "Refundable amount",
  type: "currency",
};
const NEGOTIABLE: TemplateField = {
  key: "negotiable",
  label: "Price negotiable",
  type: "boolean",
};
const OWNERSHIP: TemplateField = {
  key: "ownership",
  label: "Ownership",
  type: "enum",
  required: true,
  options: ["freehold", "leasehold", "power_of_attorney", "cooperative"],
};
const POSSESSION: TemplateField = {
  key: "possession",
  label: "Possession status",
  type: "enum",
  options: ["ready", "under_construction"],
};
const POSSESSION_DATE: TemplateField = {
  key: "possession_date",
  label: "Possession by",
  type: "date",
};
const RERA: TemplateField = { key: "rera_id", label: "RERA ID", type: "text" };
const LOAN: TemplateField = {
  key: "loan_available",
  label: "Home loan available",
  type: "boolean",
};

const FLAT_SUBTYPE: TemplateField = {
  key: "subtype",
  label: "Property type",
  type: "enum",
  options: [
    "apartment",
    "studio",
    "builder_floor",
    "penthouse",
    "duplex",
    "service_apartment",
  ],
};
const HOUSE_SUBTYPE: TemplateField = {
  key: "subtype",
  label: "Property type",
  type: "enum",
  options: ["independent_house", "villa", "duplex", "row_house", "bungalow", "farmhouse"],
};
const COMMERCIAL_SUBTYPE: TemplateField = {
  key: "subtype",
  label: "Commercial type",
  type: "enum",
  required: true,
  options: [
    "office",
    "shop",
    "showroom",
    "warehouse",
    "industrial_shed",
    "restaurant_space",
    "co_working",
    "other",
  ],
};
const PLOT_AREA_FOR_HOUSE: TemplateField = {
  key: "plot_area_sqft",
  label: "Plot area (sq ft)",
  type: "number",
};

// Commercial-specific
const WASHROOMS: TemplateField = {
  key: "washrooms",
  label: "Washrooms",
  type: "number",
};
const PANTRY: TemplateField = {
  key: "pantry",
  label: "Pantry",
  type: "boolean",
};
const CABINS: TemplateField = {
  key: "cabins",
  label: "Cabins / rooms",
  type: "number",
};

// Land-specific
const PLOT_AREA: TemplateField = {
  key: "area_sqft",
  label: "Plot area (sq ft)",
  type: "number",
  required: true,
};
const AREA_UNIT: TemplateField = {
  key: "area_unit",
  label: "Area unit",
  type: "enum",
  options: ["sqft", "sqyd", "acre", "cent", "bigha", "guntha"],
};
const PRICE_PER_UNIT: TemplateField = {
  key: "price_per_unit",
  label: "Price per sq ft / unit",
  type: "currency",
};
const DIMENSIONS: TemplateField = {
  key: "dimensions",
  label: "Plot dimensions",
  type: "text",
};
const LAND_TYPE: TemplateField = {
  key: "land_type",
  label: "Land use",
  type: "enum",
  required: true,
  options: ["residential", "agricultural", "commercial", "industrial"],
};
const ROAD_WIDTH: TemplateField = {
  key: "road_width",
  label: "Approach road width (ft)",
  type: "number",
};
const CORNER_PLOT: TemplateField = {
  key: "corner_plot",
  label: "Corner plot",
  type: "boolean",
};
const BOUNDARY: TemplateField = {
  key: "boundary",
  label: "Boundary / fencing",
  type: "enum",
  options: ["none", "partial", "full"],
};
const WATER_SOURCE: TemplateField = {
  key: "water_source",
  label: "Water source",
  type: "enum",
  options: ["borewell", "canal", "municipal", "river", "rainfed", "none"],
};
const SURVEY_NO: TemplateField = {
  key: "survey_no",
  label: "Survey / khata number",
  type: "text",
  required: true,
};
const REG_OFFICE: TemplateField = {
  key: "registration_office",
  label: "Registration sub-office",
  type: "text",
};
const GUIDELINE_VALUE: TemplateField = {
  key: "guideline_value",
  label: "Guideline / circle value",
  type: "currency",
};
const ENCUMBRANCE: TemplateField = {
  key: "encumbrance",
  label: "Encumbrance status",
  type: "enum",
  options: ["clear", "encumbered"],
};

function tpl(
  transaction_type: TransactionType,
  property_type: PropertyType,
  required: string[],
  fields: TemplateField[],
): FormTemplate {
  return { transaction_type, property_type, version: 1, validations: { required }, fields };
}

/**
 * Built-in defaults that drive the listing wizard for every supported flow.
 * They are the fallback when the DB has no override; the Super Admin console
 * can override any of these at runtime (stored in `form_templates`).
 */
export const DEFAULT_FORM_TEMPLATES: FormTemplate[] = [
  // ---------------- RENT ----------------
  tpl("rent", "flat", ["price", "deposit", "furnishing", "bhk", "area_sqft", "available_from"], [
    price("Monthly rent"), DEPOSIT, MAINTENANCE, FLAT_SUBTYPE, FURNISHING_REQ,
    BHK, BUILTUP, CARPET, FLOOR, TOTAL_FLOORS, BATHROOMS, BALCONIES, FACING,
    PARKING, AVAILABLE_FROM, PREFERRED_TENANT, LOCK_IN, NOTICE,
  ]),
  tpl("rent", "house", ["price", "deposit", "bhk", "area_sqft", "available_from"], [
    price("Monthly rent"), DEPOSIT, MAINTENANCE, HOUSE_SUBTYPE, FURNISHING,
    BHK, BUILTUP, PLOT_AREA_FOR_HOUSE, TOTAL_FLOORS, BATHROOMS, FACING, PARKING,
    AVAILABLE_FROM, PREFERRED_TENANT, LOCK_IN, NOTICE,
  ]),
  tpl("rent", "commercial", ["price", "deposit", "subtype", "area_sqft", "available_from"], [
    price("Monthly rent"), DEPOSIT, MAINTENANCE, COMMERCIAL_SUBTYPE, BUILTUP,
    CARPET, FLOOR, TOTAL_FLOORS, FURNISHING, WASHROOMS, PANTRY, CABINS, PARKING,
    AVAILABLE_FROM, LOCK_IN, NOTICE,
  ]),
  tpl("rent", "land", ["price", "area_sqft", "land_type"], [
    price("Monthly rent"), DEPOSIT, PLOT_AREA, AREA_UNIT, LAND_TYPE, DIMENSIONS,
    ROAD_WIDTH, WATER_SOURCE, BOUNDARY, AVAILABLE_FROM,
  ]),

  // ---------------- LEASE ----------------
  tpl("lease", "flat", ["price", "lease_duration", "bhk", "area_sqft"], [
    price("Lease amount"), LEASE_DURATION, REFUNDABLE, FLAT_SUBTYPE, FURNISHING,
    BHK, BUILTUP, CARPET, FLOOR, BATHROOMS, FACING, PARKING, AVAILABLE_FROM,
  ]),
  tpl("lease", "house", ["price", "lease_duration", "bhk", "area_sqft"], [
    price("Lease amount"), LEASE_DURATION, REFUNDABLE, HOUSE_SUBTYPE, FURNISHING,
    BHK, BUILTUP, PLOT_AREA_FOR_HOUSE, BATHROOMS, FACING, PARKING, AVAILABLE_FROM,
  ]),
  tpl("lease", "commercial", ["price", "lease_duration", "subtype", "area_sqft"], [
    price("Lease amount"), LEASE_DURATION, REFUNDABLE, COMMERCIAL_SUBTYPE,
    BUILTUP, CARPET, FLOOR, WASHROOMS, PANTRY, PARKING, AVAILABLE_FROM,
  ]),
  tpl("lease", "land", ["price", "lease_duration", "area_sqft", "land_type"], [
    price("Lease amount"), LEASE_DURATION, PLOT_AREA, AREA_UNIT, LAND_TYPE,
    DIMENSIONS, ROAD_WIDTH, WATER_SOURCE, BOUNDARY,
  ]),

  // ---------------- CO-LIVING / PG ----------------
  tpl("coliving", "flat", ["price", "sharing"], [
    { key: "price", label: "Price per bed / room", type: "currency", required: true },
    { key: "sharing", label: "Sharing type", type: "enum", required: true,
      options: ["private", "double", "triple", "dorm"] },
    { key: "gender_pref", label: "Gender preference", type: "enum",
      options: ["any", "male", "female"] },
    { key: "food_included", label: "Food included", type: "boolean" },
    DEPOSIT, FURNISHING, AVAILABLE_FROM, NOTICE,
    { key: "house_rules", label: "House rules", type: "text" },
  ]),
  tpl("coliving", "house", ["price", "sharing"], [
    { key: "price", label: "Price per bed / room", type: "currency", required: true },
    { key: "sharing", label: "Sharing type", type: "enum", required: true,
      options: ["private", "double", "triple", "dorm"] },
    { key: "gender_pref", label: "Gender preference", type: "enum",
      options: ["any", "male", "female"] },
    { key: "food_included", label: "Food included", type: "boolean" },
    DEPOSIT, FURNISHING, AVAILABLE_FROM, NOTICE,
    { key: "house_rules", label: "House rules", type: "text" },
  ]),

  // ---------------- SALE ----------------
  tpl("sale", "flat", ["price", "ownership", "area_sqft"], [
    price("Expected price"), NEGOTIABLE, FLAT_SUBTYPE, OWNERSHIP, AGE, BHK,
    BUILTUP, CARPET, FLOOR, TOTAL_FLOORS, BATHROOMS, BALCONIES, FACING, PARKING,
    POSSESSION, POSSESSION_DATE, RERA, LOAN,
  ]),
  tpl("sale", "house", ["price", "ownership", "area_sqft"], [
    price("Expected price"), NEGOTIABLE, HOUSE_SUBTYPE, OWNERSHIP, AGE, BHK,
    BUILTUP, PLOT_AREA_FOR_HOUSE, TOTAL_FLOORS, BATHROOMS, FACING, PARKING,
    POSSESSION, POSSESSION_DATE, RERA, LOAN,
  ]),
  tpl("sale", "commercial", ["price", "ownership", "subtype", "area_sqft"], [
    price("Expected price"), NEGOTIABLE, COMMERCIAL_SUBTYPE, OWNERSHIP, AGE,
    BUILTUP, CARPET, FLOOR, TOTAL_FLOORS, WASHROOMS, PANTRY, PARKING,
    POSSESSION, RERA, LOAN,
  ]),
  tpl("sale", "land", ["price", "area_sqft", "land_type", "survey_no"], [
    price("Price (total)"), PRICE_PER_UNIT, NEGOTIABLE, PLOT_AREA, AREA_UNIT,
    DIMENSIONS, LAND_TYPE, ROAD_WIDTH, CORNER_PLOT, BOUNDARY, WATER_SOURCE,
    SURVEY_NO, REG_OFFICE, GUIDELINE_VALUE, ENCUMBRANCE, RERA,
  ]),
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
