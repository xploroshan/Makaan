import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type { AgentProfile, AgentReview } from "@/lib/types/profile";
import type { ListingSummary } from "@/lib/types/listing";
import type {
  AgentReviewInput,
  RegisterAgentInput,
  UpdateAgentInput,
} from "@/lib/validation/agent";

const AGENT_COLUMNS =
  "id, user_id, kind, business_name, logo_url, banner_url, about, " +
  "brokerage_terms, areas_served, years_active, rating_avg, rating_count, verified";

/** Register the current user as an agent/company and grant the agent role. */
export async function registerAgent(
  supabase: DbClient,
  userId: string,
  input: RegisterAgentInput,
): Promise<AgentProfile> {
  const { data, error } = await supabase
    .from("agent_profiles")
    .insert({ user_id: userId, ...input })
    .select(AGENT_COLUMNS)
    .single();

  if (error) {
    // Unique violation → user already has an agent profile.
    if ((error as { code?: string }).code === "23505") {
      throw ApiError.conflict("You already have an agent profile");
    }
    throw error;
  }

  await grantAgentRole(supabase, userId);
  return data as unknown as AgentProfile;
}

async function grantAgentRole(supabase: DbClient, userId: string) {
  const { data } = await supabase
    .from("users")
    .select("roles")
    .eq("id", userId)
    .maybeSingle();
  const roles = new Set<string>((data?.roles as string[]) ?? ["seeker"]);
  if (!roles.has("agent")) {
    roles.add("agent");
    await supabase
      .from("users")
      .update({ roles: Array.from(roles) })
      .eq("id", userId);
  }
}

export async function updateAgent(
  supabase: DbClient,
  agentId: string,
  input: UpdateAgentInput,
): Promise<AgentProfile> {
  const { data, error } = await supabase
    .from("agent_profiles")
    .update(input)
    .eq("id", agentId)
    .select(AGENT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Agent profile not found");
  return data as unknown as AgentProfile;
}

export async function getAgentById(
  supabase: DbClient,
  agentId: string,
): Promise<AgentProfile> {
  const { data, error } = await supabase
    .from("agent_profiles")
    .select(AGENT_COLUMNS)
    .eq("id", agentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ApiError.notFound("Agent profile not found");
  return data as unknown as AgentProfile;
}

type SummaryRow = {
  id: string;
  transaction_type: ListingSummary["transaction_type"];
  property_type: ListingSummary["property_type"];
  title: string | null;
  price: number | null;
  bhk: number | null;
  area_sqft: number | null;
  furnishing: string | null;
  created_at: string;
  locations:
    | { locality: string | null; city: string | null; pincode: string | null }
    | { locality: string | null; city: string | null; pincode: string | null }[]
    | null;
  media: { url: string; sort_order: number }[] | null;
};

/** The agent's active listing portfolio (owner_id = the agent's user). */
export async function getAgentListings(
  supabase: DbClient,
  agentId: string,
): Promise<ListingSummary[]> {
  const agent = await getAgentById(supabase, agentId);
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, transaction_type, property_type, title, price, bhk, area_sqft, " +
        "furnishing, created_at, locations(locality, city, pincode), " +
        "media(url, sort_order)",
    )
    .eq("owner_id", agent.user_id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as SummaryRow[]).map(toSummary);
}

function toSummary(row: SummaryRow): ListingSummary {
  const loc = Array.isArray(row.locations)
    ? (row.locations[0] ?? null)
    : row.locations;
  const cover =
    (row.media ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)[0]
      ?.url ?? null;
  return {
    id: row.id,
    transaction_type: row.transaction_type,
    property_type: row.property_type,
    title: row.title,
    price: row.price,
    bhk: row.bhk,
    area_sqft: row.area_sqft,
    furnishing: row.furnishing,
    locality: loc?.locality ?? null,
    city: loc?.city ?? null,
    pincode: loc?.pincode ?? null,
    cover_url: cover,
    created_at: row.created_at,
  };
}

/** Create or update the caller's review of an agent (one per reviewer). */
export async function reviewAgent(
  supabase: DbClient,
  agentId: string,
  reviewerId: string,
  input: AgentReviewInput,
): Promise<AgentReview> {
  const { data, error } = await supabase
    .from("agent_reviews")
    .upsert(
      {
        agent_id: agentId,
        reviewer_id: reviewerId,
        rating: input.rating,
        text: input.text ?? null,
      },
      { onConflict: "agent_id,reviewer_id" },
    )
    .select("id, agent_id, reviewer_id, rating, text, created_at")
    .single();
  if (error) throw error;
  return data as unknown as AgentReview;
}

export async function listAgentReviews(
  supabase: DbClient,
  agentId: string,
): Promise<(AgentReview & { reviewer_name: string | null })[]> {
  const { data, error } = await supabase
    .from("agent_reviews")
    .select("id, agent_id, reviewer_id, rating, text, created_at, users(name)")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (
    (data ?? []) as unknown as (AgentReview & {
      users: { name: string | null } | { name: string | null }[] | null;
    })[]
  ).map((r) => {
    const u = Array.isArray(r.users) ? r.users[0] : r.users;
    return { ...r, reviewer_name: u?.name ?? null };
  });
}
