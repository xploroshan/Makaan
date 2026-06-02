"use client";

import { useEffect, useState } from "react";

import { ListingCard } from "@/components/listings/listing-card";
import {
  readRecentlyViewed,
  recordRecentlyViewed,
} from "@/lib/recently-viewed";
import type { ListingSummary } from "@/lib/types/listing";

/** Invisible: records the current listing as recently viewed on mount. */
export function RecentlyViewedTracker({
  listing,
}: {
  listing: ListingSummary;
}) {
  useEffect(() => {
    recordRecentlyViewed(listing);
    // Record once per listing view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id]);
  return null;
}

/** Horizontal-ish grid of the visitor's recently viewed homes. */
export function RecentlyViewedStrip({
  excludeId,
}: {
  excludeId?: string;
}) {
  const [items, setItems] = useState<ListingSummary[]>([]);

  useEffect(() => {
    void (async () => {
      setItems(readRecentlyViewed().filter((l) => l.id !== excludeId));
    })();
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-16">
      <h2 className="text-2xl font-bold sm:text-3xl">Recently viewed</h2>
      <p className="text-muted-foreground mt-1">Pick up where you left off.</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}
