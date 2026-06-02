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

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Find a home</h1>
        <Button asChild variant="outline">
          <Link href="/owner/listings/new">List your property</Link>
        </Button>
      </div>

      {nlEnabled && <NlSearchBox />}
      <SearchFilters defaults={raw} />

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-6 rounded-md border p-4 text-sm">
          {error}
        </p>
      )}

      {result.items.length === 0 && !error ? (
        <p className="text-muted-foreground mt-10 text-center">
          No listings match your search yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {result.nextCursor && (
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline">
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
