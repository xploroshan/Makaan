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

export interface OwnerDashboard {
  listings: { total: number; active: number; rented_sold: number };
  views: number;
  enquiries: { received: number; accepted: number };
  visits: { upcoming: number; completed: number };
}
