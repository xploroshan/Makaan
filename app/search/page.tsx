import { SearchX } from "lucide-react";
import Link from "next/link";

import { ListingCard } from "@/components/listings/listing-card";
import { NlSearchBox } from "@/components/search/nl-search-box";
import { SaveSearchButton } from "@/components/search/save-search-button";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchMap } from "@/components/search/search-map";
import { Button } from "@/components/ui/button";
import { isFeatureEnabled } from "@/lib/config/flags";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { searchListings, type SearchResult } from "@/lib/services/search";
import { searchQuerySchema } from "@/lib/validation/search";

export const metadata = {
  title: "Search homes",
};

type RawParams = Record<string, string | string[] | undefined>;

/** Drop empty/array values so optional enum filters validate cleanly. */
function clean(params: RawParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v != null && v !== "") out[key] = v;
  }
  return out;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = clean(await searchParams);
  const parsed = searchQuerySchema.safeParse(raw);

  let result: SearchResult = { items: [], nextCursor: null };
  let error: string | null = null;

  if (parsed.success) {
    try {
      const supabase = await createSupabaseServerClient();
      result = await searchListings(supabase, parsed.data);
    } catch {
      error =
        "Search is unavailable. Configure Supabase (.env.local) and apply the migrations.";
    }
  } else {
    error = "Some filters were invalid; showing defaults.";
  }

  const nlEnabled = await isFeatureEnabled("feature.nl_search");
  const where = raw.city || raw.pincode;

  const view = raw.view === "map" ? "map" : "list";
  const geoCenter =
    parsed.success && parsed.data.lat != null && parsed.data.lng != null
      ? { lat: parsed.data.lat, lng: parsed.data.lng }
      : null;
  // Filters to preserve when re-searching by map area (drops geo + paging).
  const baseParams = Object.fromEntries(
    Object.entries(raw).filter(
      ([k]) => !["cursor", "view", "lat", "lng", "radius_m"].includes(k),
    ),
  );
  const toUrl = (overrides: Record<string, string>) =>
    `/search?${new URLSearchParams({ ...baseParams, ...overrides }).toString()}`;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            {where ? `Homes in ${where}` : "Find a home"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {result.items.length > 0
              ? `Showing ${result.items.length} listing${result.items.length === 1 ? "" : "s"}`
              : "Browse verified, broker-free listings"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-secondary inline-flex rounded-full p-0.5 text-sm">
            <Link
              href={toUrl({})}
              className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
                view === "list"
                  ? "bg-background shadow-soft"
                  : "text-muted-foreground"
              }`}
            >
              List
            </Link>
            <Link
              href={toUrl({ view: "map" })}
              className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
                view === "map"
                  ? "bg-background shadow-soft"
                  : "text-muted-foreground"
              }`}
            >
              Map
            </Link>
          </div>
          <Button asChild variant="outline" className="hidden rounded-full sm:inline-flex">
            <Link href="/owner/listings/new">List your property</Link>
          </Button>
        </div>
      </div>

      {nlEnabled && <NlSearchBox />}
      <SearchFilters defaults={raw} />

      <div className="mt-3 flex justify-end">
        <SaveSearchButton
          filters={Object.fromEntries(
            Object.entries(raw).filter(([k]) => k !== "cursor" && k !== "sort"),
          )}
        />
      </div>

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-6 rounded-xl border p-4 text-sm">
          {error}
        </p>
      )}

      {view === "map" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="order-2 space-y-5 lg:order-1 lg:max-h-[78vh] lg:overflow-y-auto lg:pr-1">
            {result.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No listings in this view yet. Pan the map and tap “Search this
                area”, or widen your filters.
              </p>
            ) : (
              result.items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </div>
          <div className="order-1 h-[55vh] lg:order-2 lg:sticky lg:top-20 lg:h-[78vh]">
            <SearchMap
              items={result.items}
              baseParams={baseParams}
              center={geoCenter}
            />
          </div>
        </div>
      ) : result.items.length === 0 && !error ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <span className="bg-secondary text-muted-foreground flex size-16 items-center justify-center rounded-2xl">
            <SearchX className="size-8" />
          </span>
          <p className="mt-4 font-medium">No listings match your search yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Try widening your filters, or be the first to list here.
          </p>
          <Button asChild className="mt-5 rounded-full px-6">
            <Link href="/owner/listings/new">List a property</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {result.nextCursor && (
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" className="rounded-full px-8">
            <Link
              href={`/search?${new URLSearchParams({ ...raw, cursor: result.nextCursor }).toString()}`}
            >
              Load more
            </Link>
          </Button>
        </div>
      )}
    </main>
  );
}
