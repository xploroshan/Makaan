/** Domain types for listings, locations, media and form templates. */

import type { PropertyType, TransactionType } from "@/lib/validation/common";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "rented"
  | "sold"
  | "expired"
  | "rejected";

export type FieldType =
  | "currency"
  | "number"
  | "date"
  | "enum"
  | "multiselect"
  | "boolean"
  | "text";

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}

export interface FormTemplate {
  transaction_type: TransactionType;
  property_type: PropertyType;
  version: number;
  fields: TemplateField[];
  validations: { required?: string[] };
}

export interface LocationRow {
  listing_id: string;
  address: string | null;
  locality: string | null;
  city: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
}

export interface MediaRow {
  id: string;
  listing_id: string;
  type: "photo" | "video" | "tour360";
  url: string;
  sort_order: number;
  status: string;
}

export interface ListingRow {
  id: string;
  owner_id: string;
  agent_id: string | null;
  transaction_type: TransactionType;
  property_type: PropertyType;
  status: ListingStatus;
  title: string | null;
  description: string | null;
  price: number | null;
  deposit: number | null;
  area_sqft: number | null;
  bhk: number | null;
  furnishing: string | null;
  available_from: string | null;
  amenities: string[];
  attributes: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingDetail extends ListingRow {
  location: Omit<LocationRow, "listing_id"> | null;
  media: MediaRow[];
}

export interface ListingSummary {
  id: string;
  transaction_type: TransactionType;
  property_type: PropertyType;
  title: string | null;
  price: number | null;
  bhk: number | null;
  area_sqft: number | null;
  furnishing: string | null;
  locality: string | null;
  city: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  cover_url: string | null;
  created_at: string;
}
