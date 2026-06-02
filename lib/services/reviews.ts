import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type { UserReviewInput } from "@/lib/validation/review";

export interface UserReview {
  id: string;
  reviewer_id: string;
  subject_id: string;
  rating: number;
  text: string | null;
  created_at: string;
  reviewer_name: string | null;
}

export interface UserReviewSummary {
  items: UserReview[];
  average: number;
  count: number;
}

/**
 * Create or update the caller's review of another user. The RLS policy permits
 * the insert only when the two have genuinely interacted (accepted enquiry or
 * completed visit), so a review can't be faked. DB errors map to API errors.
 */
export async function reviewUser(
  supabase: DbClient,
  reviewerId: string,
  subjectId: string,
  input: UserReviewInput,
): Promise<{ id: string; rating: number }> {
  const { data, error } = await supabase
    .from("user_reviews")
    .upsert(
      {
        reviewer_id: reviewerId,
        subject_id: subjectId,
        rating: input.rating,
        text: input.text ?? null,
      },
      { onConflict: "reviewer_id,subject_id" },
    )
    .select("id, rating")
    .single();

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "42501") {
      throw ApiError.forbidden(
        "You can review someone only after you've connected (accepted enquiry or completed visit).",
      );
    }
    if (code === "23514") {
      throw ApiError.validation("You can't review yourself.");
    }
    throw error;
  }
  return data as unknown as { id: string; rating: number };
}

export async function listUserReviews(
  supabase: DbClient,
  subjectId: string,
): Promise<UserReviewSummary> {
  const { data, error } = await supabase
    .from("user_reviews")
    .select(
      "id, reviewer_id, subject_id, rating, text, created_at, users!user_reviews_reviewer_id_fkey(name)",
    )
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const rows = (data ?? []) as unknown as (Omit<UserReview, "reviewer_name"> & {
    users: { name: string | null } | { name: string | null }[] | null;
  })[];

  const items: UserReview[] = rows.map((r) => {
    const u = Array.isArray(r.users) ? r.users[0] : r.users;
    return {
      id: r.id,
      reviewer_id: r.reviewer_id,
      subject_id: r.subject_id,
      rating: r.rating,
      text: r.text,
      created_at: r.created_at,
      reviewer_name: u?.name ?? null,
    };
  });

  const count = items.length;
  const average =
    count > 0 ? items.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { items, average, count };
}
