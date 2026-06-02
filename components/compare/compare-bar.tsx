"use client";

import Link from "next/link";
import { Scale, X } from "lucide-react";

import { useCompare } from "@/components/compare/compare-provider";

/** Floating tray that appears whenever the user has homes queued to compare. */
export function CompareBar() {
  const { items, remove, clear } = useCompare();
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="bg-popover shadow-lift pointer-events-auto flex max-w-full items-center gap-3 rounded-2xl border p-2 pl-4">
        <span className="text-primary hidden items-center gap-1.5 text-sm font-semibold sm:inline-flex">
          <Scale className="size-4" /> Compare
        </span>
        <div className="flex items-center gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="bg-secondary flex items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-xs"
            >
              <span className="max-w-28 truncate">
                {item.title ?? "Listing"}
              </span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label="Remove"
                className="hover:bg-background flex size-5 items-center justify-center rounded-full"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-muted-foreground hover:text-foreground ml-1 text-xs"
        >
          Clear
        </button>
        <Link
          href="/compare"
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium"
        >
          Compare {items.length}
        </Link>
      </div>
    </div>
  );
}
