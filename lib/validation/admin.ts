import { z } from "zod";

import { latitude, longitude, propertyType, transactionType } from "./common";

export const userAdminSchema = z
  .object({
    status: z.enum(["active", "suspended", "banned"]).optional(),
    roles: z.array(z.enum(["seeker", "owner", "agent", "admin"])).optional(),
  })
  .refine((v) => v.status !== undefined || v.roles !== undefined, {
    message: "Provide a status or roles to update",
  });
export type UserAdminInput = z.infer<typeof userAdminSchema>;

export const moderateListingSchema = z.object({
  action: z.enum([
    "approve",
    "reject",
    "expire",
    "pause",
    "feature",
    "unfeature",
    "remove",
  ]),
  reason: z.string().max(500).optional(),
});
export type ModerateListingInput = z.infer<typeof moderateListingSchema>;

export const reviewVerificationSchema = z.object({
  decision: z.enum(["verified", "rejected"]),
});
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;

export const reportUpdateSchema = z.object({
  status: z.enum(["open", "reviewing", "actioned", "dismissed"]),
});
export type ReportUpdateInput = z.infer<typeof reportUpdateSchema>;

const templateField = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    "currency",
    "number",
    "date",
    "enum",
    "multiselect",
    "boolean",
    "text",
  ]),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

export const formTemplateAdminSchema = z.object({
  transaction_type: transactionType,
  property_type: propertyType,
  version: z.coerce.number().int().min(1).default(1),
  fields: z.array(templateField),
  validations: z
    .object({ required: z.array(z.string()).optional() })
    .default({}),
  enabled: z.boolean().default(true),
});
export type FormTemplateAdminInput = z.infer<typeof formTemplateAdminSchema>;

export const geoAdminSchema = z.object({
  country: z.string().length(2).default("IN"),
  city: z.string().min(1).max(120),
  locality: z.string().max(120).optional(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/)
    .optional(),
  lat: latitude.optional(),
  lng: longitude.optional(),
  enabled: z.boolean().default(true),
});
export type GeoAdminInput = z.infer<typeof geoAdminSchema>;

export const geoUpdateSchema = z.object({ enabled: z.boolean() });

export const configAdminSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.unknown(),
  scope: z.string().max(120).default("global"),
  enabled: z.boolean().default(true),
});
export type ConfigAdminInput = z.infer<typeof configAdminSchema>;

export const verifyAgentSchema = z.object({ verified: z.boolean() });
