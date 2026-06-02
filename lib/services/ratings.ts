import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type { PropertyRating } from "@/lib/types/connect";
import type { RatePropertyInput } from "@/lib/validation/connect";

/**
 * Record a visit-gated property rating. The RLS policy on `property_ratings`
 * permits the insert only when a completed visit exists for this seeker +
 * listing, so a fake/drive-by rating is impossible. We translate the DB
 * errors into friendly API errors.
 */
export async function rateProperty(
  supabase: DbClient,
  listingId: string,
  seekerId: string,
  input: RatePropertyInput,
): Promise<PropertyRating> {
  const { data, error } = await supabase
    .from("property_ratings")
    .insert({
      listing_id: listingId,
      seeker_id: seekerId,
      visit_id: input.visit_id,
      rating: input.rating,
      review: input.review ?? null,
    })
    .select("id, listing_id, seeker_id, visit_id, rating, review, created_at")
    .single();

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505") {
      throw ApiError.conflict("You have already rated this property");
    }
    if (code === "42501") {
      throw ApiError.forbidden(
        "You can rate a property only after a completed visit",
      );
    }
    throw error;
  }
  return data as unknown as PropertyRating;
}

export interface RatingWithAuthor extends PropertyRating {
  author_name: string | null;
}

export async function listListingRatings(
  supabase: DbClient,
  listingId: string,
): Promise<RatingWithAuthor[]> {
  const { data, error } = await supabase
    .from("property_ratings")
    .select(
      "id, listing_id, seeker_id, visit_id, rating, review, created_at, users(name)",
    )
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    (data ?? []) as unknown as (PropertyRating & {
      users: { name: string | null } | { name: string | null }[] | null;
    })[]
  ).map((r) => {
    const u = Array.isArray(r.users) ? r.users[0] : r.users;
    return { ...r, author_name: u?.name ?? null };
  });
}
