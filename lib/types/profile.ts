/** Domain types for seeker profiles, agents and verification. */

export interface SeekerPrivacy {
  show_bio: boolean;
  show_occupation: boolean;
  show_lifestyle: boolean;
}

export const DEFAULT_SEEKER_PRIVACY: SeekerPrivacy = {
  show_bio: true,
  show_occupation: true,
  show_lifestyle: true,
};

export interface SeekerProfile {
  user_id: string;
  bio: string | null;
  city: string | null;
  occupation: string | null;
  is_student: boolean;
  languages: string[];
  privacy: SeekerPrivacy;
}

export interface LifestyleProfile {
  user_id: string;
  schedule: string | null;
  food: string | null;
  cleanliness: string | null;
  smoking: boolean | null;
  pets: boolean | null;
  guests: string | null;
  gender_pref: string | null;
}

export type AgentKind = "agent" | "company";

export interface AgentProfile {
  id: string;
  user_id: string;
  kind: AgentKind;
  business_name: string;
  logo_url: string | null;
  banner_url: string | null;
  about: string | null;
  brokerage_terms: string | null;
  areas_served: string[];
  years_active: number | null;
  rating_avg: number;
  rating_count: number;
  verified: boolean;
}

export interface AgentReview {
  id: string;
  agent_id: string;
  reviewer_id: string;
  rating: number;
  text: string | null;
  created_at: string;
}

export type VerificationType = "identity" | "ownership";
export type VerificationStatus = "pending" | "verified" | "rejected";

export interface Verification {
  id: string;
  user_id: string;
  listing_id: string | null;
  type: VerificationType;
  status: VerificationStatus;
  evidence_ref: string | null;
  verified_at: string | null;
}

/** Trust badges shown on profiles, derived from verification records. */
export interface TrustBadges {
  identityVerified: boolean;
  ownershipVerified: boolean;
}
