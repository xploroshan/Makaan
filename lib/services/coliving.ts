import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type { ColivingRoomInput } from "@/lib/validation/coliving";

export interface ColivingRoom {
  id: string;
  listing_id: string;
  name: string;
  room_type: string;
  total_beds: number;
  occupied_beds: number;
  rent: number | null;
  created_at: string;
  updated_at: string;
}

export interface ColivingSummary {
  rooms: number;
  total_beds: number;
  occupied_beds: number;
  vacant_beds: number;
  /** 0..1 — share of beds occupied. */
  occupancy_rate: number;
}

export interface ColivingRoomsResult {
  listing: { id: string; title: string | null };
  rooms: ColivingRoom[];
  summary: ColivingSummary;
}

export interface ColivingProperty {
  id: string;
  title: string | null;
  summary: ColivingSummary;
}

export interface ColivingOverview {
  totals: ColivingSummary & { properties: number };
  properties: ColivingProperty[];
}

interface BedCount {
  total_beds: number;
  occupied_beds: number;
}

/**
 * Pure: roll a set of rooms up into an occupancy summary. Unit-tested so the
 * dashboard maths stays correct independent of the data source.
 */
export function summariseOccupancy(rooms: BedCount[]): ColivingSummary {
  const total_beds = rooms.reduce((s, r) => s + r.total_beds, 0);
  const occupied_beds = rooms.reduce((s, r) => s + r.occupied_beds, 0);
  return {
    rooms: rooms.length,
    total_beds,
    occupied_beds,
    vacant_beds: total_beds - occupied_beds,
    occupancy_rate: total_beds > 0 ? occupied_beds / total_beds : 0,
  };
}

/** Load a listing and assert the caller owns it and it's a co-living listing. */
async function getOwnedColivingListing(
  supabase: DbClient,
  listingId: string,
  ownerId: string,
): Promise<{ id: string; title: string | null }> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, owner_id, transaction_type")
    .eq("id", listingId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Listing not found");
  const row = data as unknown as {
    id: string;
    title: string | null;
    owner_id: string;
    transaction_type: string;
  };
  if (row.owner_id !== ownerId) {
    throw ApiError.forbidden("You don't own this listing");
  }
  if (row.transaction_type !== "coliving") {
    throw ApiError.validation(
      "Rooms can only be managed on co-living / PG listings.",
    );
  }
  return { id: row.id, title: row.title };
}

/** Map a check-constraint violation to a friendly validation error. */
function mapWriteError(error: { code?: string } | null): never | void {
  if (error?.code === "23514") {
    throw ApiError.validation("Occupied beds can't exceed total beds.");
  }
  if (error) throw error;
}

/** Rooms + occupancy summary for one co-living listing owned by the caller. */
export async function listRooms(
  supabase: DbClient,
  ownerId: string,
  listingId: string,
): Promise<ColivingRoomsResult> {
  const listing = await getOwnedColivingListing(supabase, listingId, ownerId);
  const { data, error } = await supabase
    .from("coliving_rooms")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rooms = (data ?? []) as unknown as ColivingRoom[];
  return { listing, rooms, summary: summariseOccupancy(rooms) };
}

export async function createRoom(
  supabase: DbClient,
  ownerId: string,
  listingId: string,
  input: ColivingRoomInput,
): Promise<ColivingRoom> {
  await getOwnedColivingListing(supabase, listingId, ownerId);
  const { data, error } = await supabase
    .from("coliving_rooms")
    .insert({
      listing_id: listingId,
      name: input.name,
      room_type: input.room_type,
      total_beds: input.total_beds,
      occupied_beds: input.occupied_beds,
      rent: input.rent ?? null,
    })
    .select("*")
    .single();
  mapWriteError(error as { code?: string } | null);
  return data as unknown as ColivingRoom;
}

export async function updateRoom(
  supabase: DbClient,
  roomId: string,
  input: ColivingRoomInput,
): Promise<ColivingRoom> {
  // RLS restricts the update to rooms on the caller's own listings.
  const { data, error } = await supabase
    .from("coliving_rooms")
    .update({
      name: input.name,
      room_type: input.room_type,
      total_beds: input.total_beds,
      occupied_beds: input.occupied_beds,
      rent: input.rent ?? null,
    })
    .eq("id", roomId)
    .select("*")
    .maybeSingle();
  mapWriteError(error as { code?: string } | null);
  if (!data) throw ApiError.notFound("Room not found");
  return data as unknown as ColivingRoom;
}

export async function deleteRoom(
  supabase: DbClient,
  roomId: string,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("coliving_rooms")
    .delete()
    .eq("id", roomId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Room not found");
  return data as unknown as { id: string };
}

/** Portfolio-wide occupancy across all of the caller's co-living listings. */
export async function colivingOverview(
  supabase: DbClient,
  ownerId: string,
): Promise<ColivingOverview> {
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, title")
    .eq("owner_id", ownerId)
    .eq("transaction_type", "coliving")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const props = (listings ?? []) as unknown as {
    id: string;
    title: string | null;
  }[];
  if (props.length === 0) {
    return {
      totals: { properties: 0, ...summariseOccupancy([]) },
      properties: [],
    };
  }

  const ids = props.map((p) => p.id);
  const { data: roomRows, error: roomErr } = await supabase
    .from("coliving_rooms")
    .select("listing_id, total_beds, occupied_beds")
    .in("listing_id", ids);
  if (roomErr) throw roomErr;

  const rooms = (roomRows ?? []) as unknown as (BedCount & {
    listing_id: string;
  })[];
  const byListing = new Map<string, BedCount[]>();
  for (const r of rooms) {
    const bucket = byListing.get(r.listing_id) ?? [];
    bucket.push({ total_beds: r.total_beds, occupied_beds: r.occupied_beds });
    byListing.set(r.listing_id, bucket);
  }

  const properties: ColivingProperty[] = props.map((p) => ({
    id: p.id,
    title: p.title,
    summary: summariseOccupancy(byListing.get(p.id) ?? []),
  }));

  return {
    totals: { properties: props.length, ...summariseOccupancy(rooms) },
    properties,
  };
}
