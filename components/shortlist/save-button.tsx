"use client";

import { Heart } from "lucide-react";

import { useShortlist } from "@/components/shortlist/shortlist-provider";
import { cn } from "@/lib/utils";

/** ♥ toggle. Optimistic; routes guests to sign in. */
export function SaveButton({
  listingId,
  className,
  withLabel = false,
}: {
  listingId: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { has, toggle } = useShortlist();
  const saved = has(listingId);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    void toggle(listingId);
  }

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          saved
            ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40"
            : "hover:border-primary hover:text-primary",
          className,
        )}
      >
        <Heart className={cn("size-4", saved && "fill-rose-500 text-rose-500")} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "Remove from saved homes" : "Save home"}
      aria-pressed={saved}
      className={cn(
        "bg-background/85 shadow-soft flex size-9 items-center justify-center rounded-full backdrop-blur transition-transform hover:scale-110",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-[18px]",
          saved ? "fill-rose-500 text-rose-500" : "text-foreground",
        )}
      />
    </button>
  );
}
