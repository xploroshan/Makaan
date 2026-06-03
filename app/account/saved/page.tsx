"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ListingCard } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { ListingSummary } from "@/lib/types/listing";

export default function SavedHomesPage() {
  const [items, setItems] = useState<ListingSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ListingSummary[]>("/api/v1/me/shortlist")
      .then(setItems)
      .catch((e: unknown) =>
        setError(
          e instanceof ApiClientError && e.code === "unauthenticated"
            ? "Please sign in to see your saved homes."
            : "Could not load your saved homes.",
        ),
      );
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold">Saved homes</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Your private shortlist — only you can see it.
      </p>

      {error && (
        <div className="mt-8 text-center">
          <p className="border-warning/40 bg-warning/10 mx-auto max-w-md rounded-xl border p-4 text-sm">
            {error}
          </p>
          <Button asChild className="mt-4 rounded-full px-6">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {items && items.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="bg-secondary text-muted-foreground flex size-16 items-center justify-center rounded-2xl">
            <Heart className="size-8" />
          </span>
          <p className="mt-4 font-medium">No saved homes yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tap the ♥ on any listing to save it here for later.
          </p>
          <Button asChild className="mt-5 rounded-full px-6">
            <Link href="/search">Browse homes</Link>
          </Button>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </main>
  );
}
