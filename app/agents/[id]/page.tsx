import { notFound } from "next/navigation";

import { ListingCard } from "@/components/listings/listing-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { ApiError } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import {
  getAgentById,
  getAgentListings,
  listAgentReviews,
} from "@/lib/services/agents";
import type { AgentProfile, AgentReview } from "@/lib/types/profile";
import type { ListingSummary } from "@/lib/types/listing";

type Params = { id: string };

export default async function AgentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  let agent: AgentProfile;
  let listings: ListingSummary[] = [];
  let reviews: (AgentReview & { reviewer_name: string | null })[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    agent = await getAgentById(supabase, id);
    [listings, reviews] = await Promise.all([
      getAgentListings(supabase, id),
      listAgentReviews(supabase, id),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.code === "not_found") notFound();
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="border-warning/40 bg-warning/10 rounded-md border p-4 text-sm">
          This profile can’t be loaded. Configure Supabase to view live data.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1">
      {/* Banner */}
      <div className="bg-secondary relative h-40 w-full sm:h-56">
        {agent.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="border-background bg-muted flex size-20 items-center justify-center overflow-hidden rounded-xl border-4">
            {agent.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.logo_url}
                alt={agent.business_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold">
                {agent.business_name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{agent.business_name}</h1>
              {agent.verified && <Badge variant="success">Verified pro</Badge>}
              <Badge variant="secondary">{agent.kind}</Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
              <Stars value={agent.rating_avg} count={agent.rating_count} />
              {agent.years_active != null && (
                <span>{agent.years_active} yrs active</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {agent.about && (
              <section>
                <h2 className="text-lg font-semibold">About</h2>
                <p className="text-muted-foreground mt-2 whitespace-pre-line">
                  {agent.about}
                </p>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold">
                Listings ({listings.length})
              </h2>
              {listings.length === 0 ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  No active listings yet.
                </p>
              ) : (
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {listings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                Reviews ({reviews.length})
              </h2>
              <div className="mt-4 space-y-4">
                {reviews.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No reviews yet.
                  </p>
                )}
                {reviews.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {r.reviewer_name ?? "A seeker"}
                        </span>
                        <Stars value={r.rating} />
                      </div>
                      {r.text && (
                        <p className="text-muted-foreground mt-2 text-sm">
                          {r.text}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <Card>
              <CardContent className="space-y-3 p-5 text-sm">
                {agent.brokerage_terms && (
                  <div>
                    <div className="font-medium">Brokerage</div>
                    <p className="text-muted-foreground">
                      {agent.brokerage_terms}
                    </p>
                  </div>
                )}
                {agent.areas_served.length > 0 && (
                  <div>
                    <div className="font-medium">Areas served</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {agent.areas_served.map((a) => (
                        <Badge key={a} variant="outline">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
