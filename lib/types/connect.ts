/** Domain types for the connect & trust flow. */

export type EnquiryStatus = "pending" | "accepted" | "declined";
export type VisitMode = "physical" | "video";
export type VisitStatus = "proposed" | "confirmed" | "completed" | "cancelled";

export interface Enquiry {
  id: string;
  listing_id: string;
  seeker_id: string;
  status: EnquiryStatus;
  contact_revealed: boolean;
  message: string | null;
  created_at: string;
}

export interface EnquiryWithListing extends Enquiry {
  listing_title: string | null;
  owner_id: string;
}

export interface Chat {
  id: string;
  listing_id: string | null;
  owner_id: string;
  seeker_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Visit {
  id: string;
  listing_id: string;
  seeker_id: string;
  slot: string;
  mode: VisitMode;
  status: VisitStatus;
}

export interface PropertyRating {
  id: string;
  listing_id: string;
  seeker_id: string;
  visit_id: string;
  rating: number;
  review: string | null;
  created_at: string;
}

export interface RevealedContact {
  phone: string | null;
  email: string | null;
}

export type OfferStatus =
  | "submitted"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "completed";

export interface Offer {
  id: string;
  listing_id: string;
  applicant_id: string;
  offer_price: number;
  deposit: number | null;
  move_in: string | null;
  duration_months: number | null;
  message: string | null;
  status: OfferStatus;
  created_at: string;
}

/** An offer as the applicant sees it (with listing context). */
export interface OfferWithListing extends Offer {
  listing_title: string | null;
  owner_id: string;
  transaction_type: string;
  listing_status: string;
}

/** An offer as the owner sees it (with applicant + listing context). */
export interface OfferWithApplicant extends Offer {
  listing_title: string | null;
  transaction_type: string;
  applicant_name: string | null;
}

export interface OwnerDashboard {
  listings: { total: number; active: number; rented_sold: number };
  views: number;
  enquiries: { received: number; accepted: number };
  visits: { upcoming: number; completed: number };
}
