"use client";

import { Bell, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { SavedSearch } from "@/lib/services/alerts";

function describe(filters: Record<string, string>): string {
  const parts: string[] = [];
  if (filters.transaction_type) parts.push(filters.transaction_type);
  if (filters.bhk) parts.push(`${filters.bhk} BHK`);
  if (filters.property_type) parts.push(filters.property_type);
  if (filters.city) parts.push(`in ${filters.city}`);
  if (filters.pincode) parts.push(`pincode ${filters.pincode}`);
  if (filters.q) parts.push(`“${filters.q}”`);
  return parts.length ? parts.join(" · ") : "All listings";
}

export default function AlertsPage() {
  const [searches, setSearches] = useState<SavedSearch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    apiFetch<SavedSearch[]>("/api/v1/me/saved-searches")
      .then(setSearches)
      .catch((e: unknown) =>
        setError(
          e instanceof ApiClientError && e.code === "unauthenticated"
            ? "Please sign in to manage your alerts."
            : "Could not load your saved searches.",
        ),
      );
  }

  useEffect(() => {
    let active = true;
    apiFetch<SavedSearch[]>("/api/v1/me/saved-searches")
      .then((d) => active && setSearches(d))
      .catch((e: unknown) =>
        setError(
          e instanceof ApiClientError && e.code === "unauthenticated"
            ? "Please sign in to manage your alerts."
            : "Could not load your saved searches.",
        ),
      );
    return () => {
      active = false;
    };
  }, []);

  async function remove(id: string) {
    await apiFetch(`/api/v1/me/saved-searches/${id}`, { method: "DELETE" });
    load();
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <p className="border-warning/40 bg-warning/10 rounded-xl border p-4 text-sm">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <div className="flex items-center gap-3">
        <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
          <Bell className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Saved searches &amp; alerts</h1>
          <p className="text-muted-foreground text-sm">
            We&apos;ll notify you when new homes match.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {searches?.length === 0 && (
          <div className="bg-card shadow-soft rounded-2xl border p-8 text-center">
            <p className="font-medium">No saved searches yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Run a search, then tap “Save this search” to get alerts.
            </p>
            <Button asChild className="mt-4 rounded-full px-6">
              <Link href="/search">
                <Search className="size-4" /> Start searching
              </Link>
            </Button>
          </div>
        )}
        {searches?.map((s) => {
          const qs = new URLSearchParams(s.filters).toString();
          return (
            <div
              key={s.id}
              className="bg-card shadow-soft flex items-center justify-between gap-3 rounded-2xl border p-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/search?${qs}`}
                  className="font-medium hover:underline"
                >
                  {s.name || describe(s.filters)}
                </Link>
                <div className="text-muted-foreground text-sm">
                  {describe(s.filters)} · {s.frequency}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(s.id)}
                aria-label="Delete saved search"
              >
                <Trash2 className="text-destructive size-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
