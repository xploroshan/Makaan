import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import { createSupabaseAdminClient } from "@/lib/db/supabase-admin";
import type {
  Enquiry,
  EnquiryWithListing,
  RevealedContact,
} from "@/lib/types/connect";
import type { CreateEnquiryInput } from "@/lib/validation/connect";

const ENQUIRY_COLUMNS =
  "id, listing_id, seeker_id, status, contact_revealed, message, created_at";

/**
 * Express interest in a listing. Creates the enquiry (idempotent per
 * seeker+listing) and ensures a chat thread exists between the two parties.
 * Contact stays hidden until the owner accepts — the zero-spam core.
 */
export async function createEnquiry(
  supabase: DbClient,
  seekerId: string,
  input: CreateEnquiryInput,
): Promise<{ enquiry: Enquiry; chat_id: string }> {
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, owner_id, status")
    .eq("id", input.listing_id)
    .maybeSingle();
  if (listingErr) throw listingErr;
  if (!listing) throw ApiError.notFound("Listing not found");
  if (listing.owner_id === seekerId) {
    throw ApiError.validation("You cannot enquire about your own listing");
  }

  let enquiry: Enquiry;
  const insert = await supabase
    .from("enquiries")
    .insert({
      listing_id: input.listing_id,
      seeker_id: seekerId,
      message: input.message ?? null,
    })
    .select(ENQUIRY_COLUMNS)
    .single();

  if (insert.error) {
    if ((insert.error as { code?: string }).code === "23505") {
      const existing = await supabase
        .from("enquiries")
        .select(ENQUIRY_COLUMNS)
        .eq("listing_id", input.listing_id)
        .eq("seeker_id", seekerId)
        .single();
      if (existing.error) throw existing.error;
      enquiry = existing.data as unknown as Enquiry;
    } else {
      throw insert.error;
    }
  } else {
    enquiry = insert.data as unknown as Enquiry;
  }

  const chat = await supabase
    .from("chats")
    .upsert(
      {
        listing_id: input.listing_id,
        owner_id: listing.owner_id,
        seeker_id: seekerId,
      },
      { onConflict: "listing_id,owner_id,seeker_id" },
    )
    .select("id")
    .single();
  if (chat.error) throw chat.error;

  return { enquiry, chat_id: (chat.data as { id: string }).id };
}

/** Owner accepts or declines an enquiry. Accepting reveals contact. */
export async function respondToEnquiry(
  supabase: DbClient,
  enquiryId: string,
  action: "accept" | "decline",
): Promise<Enquiry> {
  const { data, error } = await supabase
    .from("enquiries")
    .update({
      status: action === "accept" ? "accepted" : "declined",
      contact_revealed: action === "accept",
    })
    .eq("id", enquiryId)
    .select(ENQUIRY_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  // RLS lets only the listing owner update; no row means not permitted.
  if (!data) throw ApiError.forbidden("You cannot respond to this enquiry");
  return data as unknown as Enquiry;
}

export async function listMyEnquiries(
  supabase: DbClient,
  userId: string,
): Promise<{ sent: EnquiryWithListing[]; received: EnquiryWithListing[] }> {
  const [sent, received] = await Promise.all([
    supabase
      .from("enquiries")
      .select(`${ENQUIRY_COLUMNS}, listings!inner(title, owner_id)`)
      .eq("seeker_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("enquiries")
      .select(`${ENQUIRY_COLUMNS}, listings!inner(title, owner_id)`)
      .eq("listings.owner_id", userId)
      .order("created_at", { ascending: false }),
  ]);
  if (sent.error) throw sent.error;
  if (received.error) throw received.error;
  return {
    sent: (sent.data ?? []).map(flattenEnquiry),
    received: (received.data ?? []).map(flattenEnquiry),
  };
}

function flattenEnquiry(row: unknown): EnquiryWithListing {
  const r = row as Enquiry & {
    listings:
      | { title: string | null; owner_id: string }
      | { title: string | null; owner_id: string }[]
      | null;
  };
  const l = Array.isArray(r.listings) ? r.listings[0] : r.listings;
  return {
    id: r.id,
    listing_id: r.listing_id,
    seeker_id: r.seeker_id,
    status: r.status,
    contact_revealed: r.contact_revealed,
    message: r.message,
    created_at: r.created_at,
    listing_title: l?.title ?? null,
    owner_id: l?.owner_id ?? "",
  };
}

/** True if this seeker has an accepted, contact-revealed enquiry on a listing. */
export async function hasRevealedContact(
  supabase: DbClient,
  listingId: string,
  seekerId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("enquiries")
    .select("id")
    .eq("listing_id", listingId)
    .eq("seeker_id", seekerId)
    .eq("status", "accepted")
    .eq("contact_revealed", true)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Return the owner's real contact for an accepted enquiry only. Verifies the
 * enquiry with the caller's RLS client, then reads the owner contact via the
 * service role (owner rows aren't otherwise readable) — consent enforced.
 */
export async function getRevealedOwnerContact(
  supabase: DbClient,
  enquiryId: string,
  seekerId: string,
): Promise<RevealedContact> {
  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("id, listing_id, seeker_id, status, contact_revealed")
    .eq("id", enquiryId)
    .maybeSingle();

  if (
    !enquiry ||
    enquiry.seeker_id !== seekerId ||
    enquiry.status !== "accepted" ||
    !enquiry.contact_revealed
  ) {
    throw ApiError.forbidden("Contact is not available for this enquiry");
  }

  const admin = createSupabaseAdminClient();
  const { data: listing } = await admin
    .from("listings")
    .select("owner_id")
    .eq("id", enquiry.listing_id)
    .single();
  const { data: owner } = await admin
    .from("users")
    .select("phone, email")
    .eq("id", (listing as { owner_id: string }).owner_id)
    .single();

  return {
    phone: (owner as RevealedContact | null)?.phone ?? null,
    email: (owner as RevealedContact | null)?.email ?? null,
  };
}
