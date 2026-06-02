import type { DbClient } from "@/lib/db/client";
import type { OwnerDashboard } from "@/lib/types/connect";

/** Aggregate the owner/agent performance dashboard (PRD §5.9). */
export async function getOwnerDashboard(
  supabase: DbClient,
  ownerId: string,
): Promise<OwnerDashboard> {
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, status, view_count")
    .eq("owner_id", ownerId);
  if (error) throw error;

  const rows = (listings ?? []) as {
    id: string;
    status: string;
    view_count: number;
  }[];
  const ids = rows.map((r) => r.id);

  const views = rows.reduce((sum, r) => sum + (r.view_count ?? 0), 0);
  const active = rows.filter((r) => r.status === "active").length;
  const rentedSold = rows.filter(
    (r) => r.status === "rented" || r.status === "sold",
  ).length;

  let received = 0;
  let accepted = 0;
  let upcoming = 0;
  let completed = 0;

  if (ids.length) {
    const nowIso = new Date().toISOString();

    const receivedQ = await supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .in("listing_id", ids);
    received = receivedQ.count ?? 0;

    const acceptedQ = await supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .in("listing_id", ids)
      .eq("status", "accepted");
    accepted = acceptedQ.count ?? 0;

    const upcomingQ = await supabase
      .from("visits")
      .select("id", { count: "exact", head: true })
      .in("listing_id", ids)
      .in("status", ["proposed", "confirmed"])
      .gte("slot", nowIso);
    upcoming = upcomingQ.count ?? 0;

    const completedQ = await supabase
      .from("visits")
      .select("id", { count: "exact", head: true })
      .in("listing_id", ids)
      .eq("status", "completed");
    completed = completedQ.count ?? 0;
  }

  return {
    listings: { total: rows.length, active, rented_sold: rentedSold },
    views,
    enquiries: { received, accepted },
    visits: { upcoming, completed },
  };
}
