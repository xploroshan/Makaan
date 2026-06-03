"use client";

import { Scale } from "lucide-react";

import { useCompare } from "@/components/compare/compare-provider";
import { cn } from "@/lib/utils";
import type { ListingSummary } from "@/lib/types/listing";

/** Add/remove a listing from the compare tray. */
export function CompareToggle({
  listing,
  className,
}: {
  listing: ListingSummary;
  className?: string;
}) {
  const { has, toggle, full } = useCompare();
  const active = has(listing.id);
  const disabled = !active && full;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) toggle(listing);
      }}
      aria-pressed={active}
      aria-label={active ? "Remove from compare" : "Add to compare"}
      title={
        disabled ? "Compare up to 4 homes" : active ? "Comparing" : "Compare"
      }
      className={cn(
        "shadow-soft flex size-9 items-center justify-center rounded-full backdrop-blur transition-transform hover:scale-110",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-background/85 text-foreground",
        disabled && "cursor-not-allowed opacity-50 hover:scale-100",
        className,
      )}
    >
      <Scale className="size-[18px]" />
    </button>
  );
}
