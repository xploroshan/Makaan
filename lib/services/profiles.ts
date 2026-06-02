import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import {
  DEFAULT_SEEKER_PRIVACY,
  type LifestyleProfile,
  type SeekerPrivacy,
  type SeekerProfile,
  type TrustBadges,
} from "@/lib/types/profile";
import type {
  LifestyleProfileInput,
  SeekerProfileInput,
} from "@/lib/validation/profile";

import { deriveTrustBadges } from "./verifications";

/** Merge a stored privacy object with defaults so every flag is defined. */
export function normalizePrivacy(raw: unknown): SeekerPrivacy {
  const obj = (raw ?? {}) as Partial<SeekerPrivacy>;
  return { ...DEFAULT_SEEKER_PRIVACY, ...obj };
}

export interface PublicSeekerProfile {
  user_id: string;
  name: string | null;
  city: string | null;
  is_student: boolean;
  languages: string[];
  bio: string | null;
  occupation: string | null;
  lifestyle: LifestyleProfile | null;
  trust: TrustBadges;
}

/**
 * Apply the seeker's privacy settings to produce the publicly visible profile.
 * Pure and unit-tested. Hidden fields are nulled out rather than omitted so
 * the shape stays stable for clients.
 */
export function applySeekerPrivacy(args: {
  userId: string;
  name: string | null;
  seeker: SeekerProfile | null;
  lifestyle: LifestyleProfile | null;
  trust: TrustBadges;
}): PublicSeekerProfile {
  const privacy = normalizePrivacy(args.seeker?.privacy);
  return {
    user_id: args.userId,
    name: args.name,
    city: args.seeker?.city ?? null,
    is_student: args.seeker?.is_student ?? false,
    languages: args.seeker?.languages ?? [],
    bio: privacy.show_bio ? (args.seeker?.bio ?? null) : null,
    occupation: privacy.show_occupation
      ? (args.seeker?.occupation ?? null)
      : null,
    lifestyle: privacy.show_lifestyle ? args.lifestyle : null,
    trust: args.trust,
  };
}

export interface MyProfile {
  user: { id: string; name: string | null; roles: string[] };
  seeker: SeekerProfile | null;
  lifestyle: LifestyleProfile | null;
  trust: TrustBadges;
}

export async function getMyProfile(
  supabase: DbClient,
  userId: string,
): Promise<MyProfile> {
  const [user, seeker, lifestyle, verifications] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, roles")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("seeker_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("lifestyle_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("verifications").select("type, status").eq("user_id", userId),
  ]);

  return {
    user: (user.data as MyProfile["user"]) ?? {
      id: userId,
      name: null,
      roles: [],
    },
    seeker: normalizeSeeker(seeker.data),
    lifestyle: (lifestyle.data as LifestyleProfile) ?? null,
    trust: deriveTrustBadges(
      (verifications.data as { type: string; status: string }[]) ?? [],
    ),
  };
}

export async function upsertSeekerProfile(
  supabase: DbClient,
  userId: string,
  input: SeekerProfileInput,
): Promise<SeekerProfile> {
  const patch: Record<string, unknown> = { user_id: userId };
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && k !== "privacy") patch[k] = v;
  }
  if (input.privacy) {
    patch.privacy = { ...DEFAULT_SEEKER_PRIVACY, ...input.privacy };
  }
  const { data, error } = await supabase
    .from("seeker_profiles")
    .upsert(patch, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return normalizeSeeker(data)!;
}

export async function upsertLifestyleProfile(
  supabase: DbClient,
  userId: string,
  input: LifestyleProfileInput,
): Promise<LifestyleProfile> {
  const { data, error } = await supabase
    .from("lifestyle_profiles")
    .upsert({ user_id: userId, ...input }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as LifestyleProfile;
}

/** Build the privacy-respecting public profile for any seeker. */
export async function getPublicSeekerProfile(
  supabase: DbClient,
  userId: string,
): Promise<PublicSeekerProfile> {
  const [user, seeker, lifestyle, verifications] = await Promise.all([
    supabase.from("users").select("id, name").eq("id", userId).maybeSingle(),
    supabase
      .from("seeker_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("lifestyle_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("verifications").select("type, status").eq("user_id", userId),
  ]);

  if (!user.data) throw ApiError.notFound("Profile not found");

  return applySeekerPrivacy({
    userId,
    name: (user.data as { name: string | null }).name,
    seeker: normalizeSeeker(seeker.data),
    lifestyle: (lifestyle.data as LifestyleProfile) ?? null,
    trust: deriveTrustBadges(
      (verifications.data as { type: string; status: string }[]) ?? [],
    ),
  });
}

function normalizeSeeker(data: unknown): SeekerProfile | null {
  if (!data) return null;
  const row = data as SeekerProfile;
  return { ...row, privacy: normalizePrivacy(row.privacy) };
}
