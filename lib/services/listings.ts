import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type {
  ListingDetail,
  ListingRow,
  ListingStatus,
  LocationRow,
  MediaRow,
} from "@/lib/types/listing";
import type {
  AttachMediaInput,
  CreateListingInput,
  UpdateListingInput,
} from "@/lib/validation/listing";

import { resolveTemplate, validateAttributes } from "./form-templates";

const LISTING_COLUMNS =
  "id, owner_id, agent_id, transaction_type, property_type, status, title, " +
  "description, price, deposit, area_sqft, bhk, furnishing, available_from, " +
  "attributes, published_at, created_at, updated_at";

/** Attribute keys that also live as first-class, searchable columns. */
const CORE_FROM_ATTRS = [
  "price",
  "deposit",
  "area_sqft",
  "bhk",
  "furnishing",
  "available_from",
] as const;

/** Create a draft listing owned by the current user. */
export async function createDraft(
  supabase: DbClient,
  ownerId: string,
  input: CreateListingInput,
): Promise<ListingRow> {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: ownerId,
      transaction_type: input.transaction_type,
      property_type: input.property_type,
      title: input.title ?? null,
      status: "draft",
    })
    .select(LISTING_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as ListingRow;
}

async function getOwnedListing(
  supabase: DbClient,
  id: string,
): Promise<ListingRow> {
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Listing not found");
  return data as unknown as ListingRow;
}

/** Update core fields, category attributes (partial) and location of a draft. */
export async function updateListing(
  supabase: DbClient,
  id: string,
  input: UpdateListingInput,
): Promise<ListingDetail> {
  const listing = await getOwnedListing(supabase, id);

  const patch: Record<string, unknown> = {};
  for (const key of [
    "title",
    "description",
    "price",
    "deposit",
    "area_sqft",
    "bhk",
    "furnishing",
    "available_from",
  ] as const) {
    if (input[key] !== undefined) patch[key] = input[key];
  }

  if (input.attributes) {
    const template = await resolveTemplate(
      supabase,
      listing.transaction_type,
      listing.property_type,
    );
    if (!template) {
      throw ApiError.validation("No form template for this category");
    }
    // Drafts validate types but not required-presence; merge over existing.
    const validated = validateAttributes(template, input.attributes, {
      partial: true,
    });
    patch.attributes = { ...listing.attributes, ...validated };

    // Project well-known attributes onto core columns so search/sort work,
    // unless the caller set them explicitly.
    for (const key of CORE_FROM_ATTRS) {
      if (patch[key] === undefined && validated[key] !== undefined) {
        patch[key] = validated[key];
      }
    }
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase
      .from("listings")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
  }

  if (input.location) {
    const { error } = await supabase.from("locations").upsert(
      {
        listing_id: id,
        ...input.location,
      },
      { onConflict: "listing_id" },
    );
    if (error) throw error;
  }

  return getListingDetail(supabase, id, listing.owner_id);
}

/** Attach a media asset (already uploaded to storage) to a listing. */
export async function attachMedia(
  supabase: DbClient,
  id: string,
  input: AttachMediaInput,
): Promise<MediaRow> {
  await getOwnedListing(supabase, id); // existence + RLS ownership check
  const { data, error } = await supabase
    .from("media")
    .insert({
      listing_id: id,
      type: input.type,
      url: input.url,
      sort_order: input.sort_order,
    })
    .select("id, listing_id, type, url, sort_order, status")
    .single();
  if (error) throw error;
  return data as unknown as MediaRow;
}

/**
 * Change listing lifecycle. Publishing (`active`) enforces completeness:
 * required core fields, a resolvable location, and required template attributes.
 */
export async function setStatus(
  supabase: DbClient,
  id: string,
  status: ListingStatus,
): Promise<ListingRow> {
  const listing = await getOwnedListing(supabase, id);

  if (status === "active") {
    await assertPublishable(supabase, listing);
  }

  const patch: Record<string, unknown> = { status };
  if (status === "active" && !listing.published_at) {
    patch.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", id)
    .select(LISTING_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as ListingRow;
}

async function assertPublishable(
  supabase: DbClient,
  listing: ListingRow,
): Promise<void> {
  const missing: string[] = [];
  if (!listing.title) missing.push("title");
  if (listing.price == null) missing.push("price");

  const { data: loc } = await supabase
    .from("locations")
    .select("city, pincode")
    .eq("listing_id", listing.id)
    .maybeSingle();
  if (!loc || (!loc.city && !loc.pincode)) missing.push("location");

  const template = await resolveTemplate(
    supabase,
    listing.transaction_type,
    listing.property_type,
  );
  if (template) {
    // Full validation (enforces required template attributes).
    validateAttributes(template, listing.attributes);
  }

  if (missing.length > 0) {
    throw ApiError.validation("Listing is incomplete and cannot be published", {
      missing,
    });
  }
}

/**
 * Fetch a listing with location + media. Public callers see active listings
 * only (enforced by RLS); the exact street address is masked unless the
 * viewer is the owner (consent-based reveal is handled by the connect slice).
 */
export async function getListingDetail(
  supabase: DbClient,
  id: string,
  viewerId: string | null,
  revealed = false,
): Promise<ListingDetail> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      `${LISTING_COLUMNS}, ` +
        "locations(lat, lng, address, locality, city, pincode), " +
        "media(id, listing_id, type, url, sort_order, status)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw ApiError.notFound("Listing not found");

  const row = data as unknown as ListingRow & {
    locations:
      | Omit<LocationRow, "listing_id">
      | Omit<LocationRow, "listing_id">[]
      | null;
    media: MediaRow[] | null;
  };

  const rawLocation = Array.isArray(row.locations)
    ? (row.locations[0] ?? null)
    : row.locations;

  const isOwner = viewerId != null && viewerId === row.owner_id;
  const canSeeAddress = isOwner || revealed;
  const location = rawLocation
    ? { ...rawLocation, address: canSeeAddress ? rawLocation.address : null }
    : null;

  const media = (row.media ?? []).sort((a, b) => a.sort_order - b.sort_order);

  return { ...stripJoins(row), location, media };
}

function stripJoins(
  row: ListingRow & { locations?: unknown; media?: unknown },
): ListingRow {
  const { locations: _l, media: _m, ...listing } = row;
  void _l;
  void _m;
  return listing;
}

/** All listings owned by a user (for the owner dashboard). */
export async function listByOwner(
  supabase: DbClient,
  ownerId: string,
): Promise<ListingRow[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ListingRow[];
}
