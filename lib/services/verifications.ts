import type { DbClient } from "@/lib/db/client";
import type {
  TrustBadges,
  Verification,
  VerificationType,
} from "@/lib/types/profile";
import type { SubmitVerificationInput } from "@/lib/validation/verification";

/**
 * Derive trust badges from verification records. Pure + unit-tested.
 * A badge is shown only when a verification of that type is `verified`.
 */
export function deriveTrustBadges(
  records: { type: string; status: string }[],
): TrustBadges {
  const verified = (type: string) =>
    records.some((r) => r.type === type && r.status === "verified");
  return {
    identityVerified: verified("identity"),
    ownershipVerified: verified("ownership"),
  };
}

export async function submitVerification(
  supabase: DbClient,
  userId: string,
  type: VerificationType,
  input: SubmitVerificationInput,
): Promise<Verification> {
  const { data, error } = await supabase
    .from("verifications")
    .insert({
      user_id: userId,
      type,
      listing_id: input.listing_id ?? null,
      evidence_ref: input.evidence_ref,
      status: "pending",
    })
    .select("id, user_id, listing_id, type, status, evidence_ref, verified_at")
    .single();
  if (error) throw error;
  return data as unknown as Verification;
}

export async function listMyVerifications(
  supabase: DbClient,
  userId: string,
): Promise<Verification[]> {
  const { data, error } = await supabase
    .from("verifications")
    .select("id, user_id, listing_id, type, status, evidence_ref, verified_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Verification[];
}
