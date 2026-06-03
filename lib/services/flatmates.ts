import { ApiError } from "@/lib/api/errors";
import type { LifestyleTraits } from "@/lib/compatibility";
import type { DbClient } from "@/lib/db/client";
import type {
  CreateFlatmatePostInput,
  FlatmateQuery,
} from "@/lib/validation/flatmate";

export interface FlatmatePost {
  id: string;
  author_id: string;
  kind: "has_place" | "needs_place";
  city: string;
  locality: string | null;
  budget_min: number | null;
  budget_max: number | null;
  move_in: string | null;
  gender_pref: string;
  occupancy: "private" | "shared";
  headline: string;
  description: string | null;
  status: string;
  created_at: string;
  author: {
    name: string | null;
    lifestyle: LifestyleTraits | null;
  };
}

const POST_SELECT =
  "id, author_id, kind, city, locality, budget_min, budget_max, move_in, " +
  "gender_pref, occupancy, headline, description, status, created_at, " +
  "author:users!flatmate_posts_author_id_fkey(name, " +
  "lifestyle:lifestyle_profiles(schedule, food, cleanliness, smoking, pets, guests))";

type RawPost = Omit<FlatmatePost, "author"> & {
  author:
    | {
        name: string | null;
        lifestyle: LifestyleTraits | LifestyleTraits[] | null;
      }
    | { name: string | null; lifestyle: LifestyleTraits | LifestyleTraits[] | null }[]
    | null;
};

function shape(row: RawPost): FlatmatePost {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  const lifestyle = author
    ? Array.isArray(author.lifestyle)
      ? (author.lifestyle[0] ?? null)
      : author.lifestyle
    : null;
  return {
    ...row,
    author: { name: author?.name ?? null, lifestyle: lifestyle ?? null },
  };
}

export async function listFlatmatePosts(
  supabase: DbClient,
  filters: FlatmateQuery,
): Promise<FlatmatePost[]> {
  let query = supabase
    .from("flatmate_posts")
    .select(POST_SELECT)
    .eq("status", "active");

  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.occupancy) query = query.eq("occupancy", filters.occupancy);
  if (filters.gender_pref)
    query = query.in("gender_pref", [filters.gender_pref, "any"]);
  if (filters.budget_max !== undefined)
    query = query.or(
      `budget_min.is.null,budget_min.lte.${filters.budget_max}`,
    );

  query = query.order("created_at", { ascending: false }).limit(40);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as RawPost[]).map(shape);
}

export async function getFlatmatePost(
  supabase: DbClient,
  id: string,
): Promise<FlatmatePost> {
  const { data, error } = await supabase
    .from("flatmate_posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Flatmate post not found");
  return shape(data as unknown as RawPost);
}

export async function listMyFlatmatePosts(
  supabase: DbClient,
  authorId: string,
): Promise<FlatmatePost[]> {
  const { data, error } = await supabase
    .from("flatmate_posts")
    .select(POST_SELECT)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawPost[]).map(shape);
}

export async function createFlatmatePost(
  supabase: DbClient,
  authorId: string,
  input: CreateFlatmatePostInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("flatmate_posts")
    .insert({
      author_id: authorId,
      kind: input.kind,
      city: input.city,
      locality: input.locality ?? null,
      budget_min: input.budget_min ?? null,
      budget_max: input.budget_max ?? null,
      move_in: input.move_in ?? null,
      gender_pref: input.gender_pref,
      occupancy: input.occupancy,
      headline: input.headline,
      description: input.description ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data as unknown as { id: string };
}

export async function setFlatmatePostStatus(
  supabase: DbClient,
  id: string,
  status: "active" | "closed",
): Promise<{ id: string; status: string }> {
  // RLS restricts this to the author (or an admin).
  const { data, error } = await supabase
    .from("flatmate_posts")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Flatmate post not found");
  return data as unknown as { id: string; status: string };
}
