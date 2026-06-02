import type { ListingSummary } from "@/lib/types/listing";

/** localStorage-backed "recently viewed" listings (client-only, no account needed). */
const KEY = "dwello.recentlyViewed";
const MAX = 8;

export function recordRecentlyViewed(listing: ListingSummary): void {
  if (typeof window === "undefined") return;
  try {
    const list = readRecentlyViewed();
    const next = [listing, ...list.filter((l) => l.id !== listing.id)].slice(
      0,
      MAX,
    );
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode / quota — ignore.
  }
}

export function readRecentlyViewed(): ListingSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ListingSummary[]) : [];
  } catch {
    return [];
  }
}
