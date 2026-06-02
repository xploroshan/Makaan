import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type { Visit, VisitStatus } from "@/lib/types/connect";
import type { ScheduleVisitInput } from "@/lib/validation/connect";

const VISIT_COLUMNS = "id, listing_id, seeker_id, slot, mode, status";

/** Seeker proposes a visit slot (physical or live-video). */
export async function scheduleVisit(
  supabase: DbClient,
  seekerId: string,
  input: ScheduleVisitInput,
): Promise<Visit> {
  const { data, error } = await supabase
    .from("visits")
    .insert({
      listing_id: input.listing_id,
      seeker_id: seekerId,
      slot: input.slot,
      mode: input.mode,
      status: "proposed",
    })
    .select(VISIT_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as Visit;
}

/** Confirm / complete / cancel a visit (either party, enforced by RLS). */
export async function updateVisitStatus(
  supabase: DbClient,
  visitId: string,
  status: VisitStatus,
): Promise<Visit> {
  const { data, error } = await supabase
    .from("visits")
    .update({ status })
    .eq("id", visitId)
    .select(VISIT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.forbidden("You cannot update this visit");
  return data as unknown as Visit;
}

export interface VisitWithListing extends Visit {
  listing_title: string | null;
}

export async function listMyVisits(
  supabase: DbClient,
  userId: string,
): Promise<VisitWithListing[]> {
  const { data, error } = await supabase
    .from("visits")
    .select(`${VISIT_COLUMNS}, listings!inner(title, owner_id)`)
    .or(`seeker_id.eq.${userId},listings.owner_id.eq.${userId}`)
    .order("slot", { ascending: true });
  if (error) throw error;
  return (
    (data ?? []) as unknown as (Visit & {
      listings: { title: string | null } | { title: string | null }[] | null;
    })[]
  ).map((v) => {
    const l = Array.isArray(v.listings) ? v.listings[0] : v.listings;
    return {
      id: v.id,
      listing_id: v.listing_id,
      seeker_id: v.seeker_id,
      slot: v.slot,
      mode: v.mode,
      status: v.status,
      listing_title: l?.title ?? null,
    };
  });
}
