import { SearchX } from "lucide-react";
import Link from "next/link";

import { ListingCard } from "@/components/listings/listing-card";
import { NlSearchBox } from "@/components/search/nl-search-box";
import { SearchFilters } from "@/components/search/search-filters";
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
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/owner/listings/new">List your property</Link>
        </Button>
      </div>

      {nlEnabled && <NlSearchBox />}
      <SearchFilters defaults={raw} />

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-6 rounded-xl border p-4 text-sm">
          {error}
        </p>
      )}

      {result.items.length === 0 && !error ? (
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
