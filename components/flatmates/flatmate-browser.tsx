"use client";

import { MapPin, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CompatibilityBadge } from "@/components/flatmates/compatibility-badge";
import { LifestyleChips } from "@/components/flatmates/lifestyle-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { scoreCompatibility, type LifestyleTraits } from "@/lib/compatibility";
import { formatPrice } from "@/lib/format";
import type { FlatmatePost } from "@/lib/services/flatmates";

const KIND_LABEL: Record<string, string> = {
  has_place: "Has a place",
  needs_place: "Looking to share",
};

interface Filters {
  city: string;
  kind: string;
  gender_pref: string;
  occupancy: string;
  budget_max: string;
}

const EMPTY: Filters = {
  city: "",
  kind: "",
  gender_pref: "",
  occupancy: "",
  budget_max: "",
};

export function FlatmateBrowser() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [posts, setPosts] = useState<FlatmatePost[]>([]);
  const [viewer, setViewer] = useState<{
    id: string;
    lifestyle: LifestyleTraits | null;
  } | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
      const data = await apiFetch<FlatmatePost[]>(
        `/api/v1/flatmates${qs.toString() ? `?${qs}` : ""}`,
      );
      setPosts(data);
    } catch (e) {
      setError(
        e instanceof ApiClientError ? e.message : "Could not load flatmates.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const me = await apiFetch<{
          user: { id: string };
          lifestyle: LifestyleTraits | null;
        }>("/api/v1/me/profile");
        setViewer({ id: me.user.id, lifestyle: me.lifestyle });
        setSignedIn(true);
      } catch {
        // signed out — browse without compatibility.
      }
      await load(EMPTY);
    })();
  }, [load]);

  return (
    <div>
      {/* Filters */}
      <div className="bg-card shadow-soft rounded-2xl border p-4">
        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4" /> Filter flatmates
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label>City</Label>
            <Input
              value={filters.city}
              onChange={(e) =>
                setFilters({ ...filters, city: e.target.value })
              }
              placeholder="e.g. Bengaluru"
            />
          </div>
          <div>
            <Label>I want someone who</Label>
            <Select
              value={filters.kind}
              onChange={(e) =>
                setFilters({ ...filters, kind: e.target.value })
              }
            >
              <option value="">Anyone</option>
              <option value="has_place">Has a place</option>
              <option value="needs_place">Is looking to share</option>
            </Select>
          </div>
          <div>
            <Label>Gender</Label>
            <Select
              value={filters.gender_pref}
              onChange={(e) =>
                setFilters({ ...filters, gender_pref: e.target.value })
              }
            >
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </div>
          <div>
            <Label>Room</Label>
            <Select
              value={filters.occupancy}
              onChange={(e) =>
                setFilters({ ...filters, occupancy: e.target.value })
              }
            >
              <option value="">Any</option>
              <option value="private">Private</option>
              <option value="shared">Shared</option>
            </Select>
          </div>
          <div>
            <Label>Max budget</Label>
            <Input
              type="number"
              value={filters.budget_max}
              onChange={(e) =>
                setFilters({ ...filters, budget_max: e.target.value })
              }
              placeholder="₹ / month"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => load(filters)}>Apply</Button>
          {Object.values(filters).some(Boolean) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFilters(EMPTY);
                void load(EMPTY);
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {signedIn && !viewer?.lifestyle && (
        <p className="border-primary/30 bg-primary/5 mt-4 flex items-center gap-2 rounded-xl border p-3 text-sm">
          <Sparkles className="text-primary size-4" />
          Add your lifestyle to see compatibility scores.{" "}
          <Link href="/account/profile" className="text-primary underline">
            Complete your profile
          </Link>
        </p>
      )}

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-4 rounded-xl border p-4 text-sm">
          {error}
        </p>
      )}

      {!loading && posts.length === 0 && !error && (
        <div className="mt-12 flex flex-col items-center text-center">
          <span className="bg-secondary text-muted-foreground flex size-16 items-center justify-center rounded-2xl">
            <Users className="size-8" />
          </span>
          <p className="mt-4 font-medium">No flatmate posts here yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Be the first — post what you&apos;re looking for.
          </p>
          <Button asChild className="mt-5 rounded-full px-6">
            <Link href="/flatmates/new">Post a flatmate ad</Link>
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <FlatmateCard
            key={post.id}
            post={post}
            viewerLifestyle={viewer?.lifestyle ?? null}
          />
        ))}
      </div>
    </div>
  );
}

function FlatmateCard({
  post,
  viewerLifestyle,
}: {
  post: FlatmatePost;
  viewerLifestyle: LifestyleTraits | null;
}) {
  const compat =
    viewerLifestyle && post.author.lifestyle
      ? scoreCompatibility(viewerLifestyle, post.author.lifestyle)
      : null;

  return (
    <Link href={`/flatmates/${post.id}`} className="group block">
      <article className="bg-card shadow-soft group-hover:shadow-lift h-full rounded-2xl border p-5 transition-all duration-300 group-hover:-translate-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="bg-accent text-accent-foreground inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
              {KIND_LABEL[post.kind]}
            </span>
            <h3 className="mt-2 line-clamp-2 font-semibold">{post.headline}</h3>
          </div>
          {compat && compat.rated > 0 && (
            <CompatibilityBadge result={compat} size="sm" />
          )}
        </div>

        <div className="text-muted-foreground mt-3 flex items-center gap-1.5 text-sm">
          <MapPin className="size-3.5" />
          {[post.locality, post.city].filter(Boolean).join(", ")}
        </div>
        <div className="mt-1 text-sm font-medium">{budgetText(post)}</div>

        <LifestyleChips lifestyle={post.author.lifestyle} className="mt-3" />

        <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <span className="bg-brand-gradient text-primary-foreground flex size-7 items-center justify-center rounded-full text-xs font-bold">
            {(post.author.name ?? "?").charAt(0).toUpperCase()}
          </span>
          {post.author.name ?? "A member"}
          <span className="capitalize">· {post.occupancy} room</span>
        </div>
      </article>
    </Link>
  );
}

export function budgetText(post: {
  budget_min: number | null;
  budget_max: number | null;
}): string {
  const { budget_min: lo, budget_max: hi } = post;
  if (lo && hi) return `${formatPrice(lo)} – ${formatPrice(hi)}/mo`;
  if (hi) return `Up to ${formatPrice(hi)}/mo`;
  if (lo) return `From ${formatPrice(lo)}/mo`;
  return "Budget flexible";
}
