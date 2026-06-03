import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type {
  Offer,
  OfferStatus,
  OfferWithApplicant,
  OfferWithListing,
} from "@/lib/types/connect";
import type { CreateOfferInput } from "@/lib/validation/offer";

const OFFER_COLUMNS =
  "id, listing_id, applicant_id, offer_price, deposit, move_in, " +
  "duration_months, message, status, created_at";

/** On a completed deal, what the listing becomes. Pure — unit-tested. */
export function listingStatusForCompletedOffer(
  transactionType: string,
): "rented" | "sold" {
  return transactionType === "sale" ? "sold" : "rented";
}

/** Which offer status changes each role may make. Pure — unit-tested. */
export function canSetOfferStatus(
  role: "applicant" | "owner",
  to: OfferStatus,
): boolean {
  if (role === "applicant") return to === "withdrawn";
  return to === "accepted" || to === "declined" || to === "completed";
}

/** Apply / make an offer on an active listing (idempotent per applicant). */
export async function createOffer(
  supabase: DbClient,
  applicantId: string,
  listingId: string,
  input: CreateOfferInput,
): Promise<Offer> {
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, owner_id, status")
    .eq("id", listingId)
    .maybeSingle();
  if (listingErr) throw listingErr;
  if (!listing) throw ApiError.notFound("Listing not found");
  const row = listing as { owner_id: string; status: string };
  if (row.owner_id === applicantId) {
    throw ApiError.validation("You can't apply to your own listing.");
  }
  if (row.status !== "active") {
    throw ApiError.validation("This listing is not accepting applications.");
  }

  const { data, error } = await supabase
    .from("offers")
    .upsert(
      {
        listing_id: listingId,
        applicant_id: applicantId,
        offer_price: input.offer_price,
        deposit: input.deposit ?? null,
        move_in: input.move_in ?? null,
        duration_months: input.duration_months ?? null,
        message: input.message ?? null,
        status: "submitted",
      },
      { onConflict: "listing_id,applicant_id" },
    )
    .select(OFFER_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as Offer;
}

export async function listMyOffers(
  supabase: DbClient,
  applicantId: string,
): Promise<OfferWithListing[]> {
  const { data, error } = await supabase
    .from("offers")
    .select(
      `${OFFER_COLUMNS}, listings!inner(title, owner_id, transaction_type, status)`,
    )
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown[]).map((raw) => {
    const r = raw as Offer & {
      listings:
        | {
            title: string | null;
            owner_id: string;
            transaction_type: string;
            status: string;
          }
        | {
            title: string | null;
            owner_id: string;
            transaction_type: string;
            status: string;
          }[]
        | null;
    };
    const l = Array.isArray(r.listings) ? r.listings[0] : r.listings;
    return {
      ...stripJoin(r),
      listing_title: l?.title ?? null,
      owner_id: l?.owner_id ?? "",
      transaction_type: l?.transaction_type ?? "",
      listing_status: l?.status ?? "",
    };
  });
}

export async function listOwnerOffers(
  supabase: DbClient,
  ownerId: string,
): Promise<OfferWithApplicant[]> {
  const { data, error } = await supabase
    .from("offers")
    .select(
      `${OFFER_COLUMNS}, listings!inner(title, owner_id, transaction_type), ` +
        "applicant:users!offers_applicant_id_fkey(name)",
    )
    .eq("listings.owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown[]).map((raw) => {
    const r = raw as Offer & {
      listings:
        | { title: string | null; transaction_type: string }
        | { title: string | null; transaction_type: string }[]
        | null;
      applicant:
        | { name: string | null }
        | { name: string | null }[]
        | null;
    };
    const l = Array.isArray(r.listings) ? r.listings[0] : r.listings;
    const a = Array.isArray(r.applicant) ? r.applicant[0] : r.applicant;
    return {
      ...stripJoin(r),
      listing_title: l?.title ?? null,
      transaction_type: l?.transaction_type ?? "",
      applicant_name: a?.name ?? null,
    };
  });
}

/**
 * Change an offer's status with role-appropriate rules. Finalising
 * ("completed") records the deal: it flips the listing to rented/sold and
 * declines the listing's other open offers.
 */
export async function updateOfferStatus(
  supabase: DbClient,
  userId: string,
  offerId: string,
  status: OfferStatus,
): Promise<Offer> {
  const { data, error } = await supabase
    .from("offers")
    .select(`${OFFER_COLUMNS}, listings!inner(owner_id, transaction_type)`)
    .eq("id", offerId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Offer not found");

  const r = data as Offer & {
    listings:
      | { owner_id: string; transaction_type: string }
      | { owner_id: string; transaction_type: string }[]
      | null;
  };
  const listing = Array.isArray(r.listings) ? r.listings[0] : r.listings;
  const isOwner = listing?.owner_id === userId;
  const isApplicant = r.applicant_id === userId;
  if (!isOwner && !isApplicant) {
    throw ApiError.forbidden("You can't change this application.");
  }
  const role = isOwner ? "owner" : "applicant";
  if (!canSetOfferStatus(role, status)) {
    throw ApiError.forbidden("That action isn't allowed for this application.");
  }

  const upd = await supabase
    .from("offers")
    .update({ status })
    .eq("id", offerId)
    .select(OFFER_COLUMNS)
    .single();
  if (upd.error) throw upd.error;

  if (status === "completed" && listing) {
    const newStatus = listingStatusForCompletedOffer(listing.transaction_type);
    await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", r.listing_id);
    await supabase
      .from("offers")
      .update({ status: "declined" })
      .eq("listing_id", r.listing_id)
      .neq("id", offerId)
      .in("status", ["submitted", "accepted"]);
  }

  return upd.data as unknown as Offer;
}

function stripJoin(r: Offer): Offer {
  return {
    id: r.id,
    listing_id: r.listing_id,
    applicant_id: r.applicant_id,
    offer_price: r.offer_price,
    deposit: r.deposit,
    move_in: r.move_in,
    duration_months: r.duration_months,
    message: r.message,
    status: r.status,
    created_at: r.created_at,
  };
}
