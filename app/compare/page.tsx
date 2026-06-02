"use client";

import { Scale, X } from "lucide-react";
import Link from "next/link";

import { useCompare } from "@/components/compare/compare-provider";
import { Button } from "@/components/ui/button";
import { formatArea, formatPrice, transactionLabel } from "@/lib/format";
import type { ListingSummary } from "@/lib/types/listing";

type Row = {
  label: string;
  get: (l: ListingSummary) => string;
};

const ROWS: Row[] = [
  { label: "Price", get: (l) => formatPrice(l.price) },
  { label: "Type", get: (l) => transactionLabel(l.transaction_type) },
  { label: "Property", get: (l) => l.property_type },
  { label: "Configuration", get: (l) => (l.bhk ? `${l.bhk} BHK` : "—") },
  { label: "Area", get: (l) => formatArea(l.area_sqft) },
  { label: "Furnishing", get: (l) => l.furnishing ?? "—" },
  {
    label: "Location",
    get: (l) => [l.locality, l.city].filter(Boolean).join(", ") || "—",
  },
  { label: "Pincode", get: (l) => l.pincode ?? "—" },
];

export default function ComparePage() {
  const { items, remove, clear } = useCompare();

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 text-center">
        <span className="bg-secondary text-muted-foreground mx-auto flex size-16 items-center justify-center rounded-2xl">
          <Scale className="size-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Compare homes</h1>
        <p className="text-muted-foreground mt-1">
          Add up to 4 homes using the compare icon, then see them side by side.
        </p>
        <Button asChild className="mt-6 rounded-full px-6">
          <Link href="/search">Browse homes</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compare homes</h1>
        <button
          onClick={clear}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Clear all
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="w-32" />
              {items.map((l) => (
                <th key={l.id} className="min-w-48 p-2 align-top">
                  <div className="bg-card shadow-soft relative overflow-hidden rounded-xl border text-left">
                    <button
                      onClick={() => remove(l.id)}
                      aria-label="Remove"
                      className="bg-background/85 absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full backdrop-blur"
                    >
                      <X className="size-4" />
                    </button>
                    <Link href={`/listings/${l.id}`}>
                      <div className="bg-muted aspect-[4/3] overflow-hidden">
                        {l.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={l.cover_url}
                            alt={l.title ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="from-primary/15 to-gold/10 h-full w-full bg-gradient-to-br" />
                        )}
                      </div>
                      <div className="line-clamp-1 p-3 text-sm font-semibold">
                        {l.title ?? "Untitled listing"}
                      </div>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.label} className={i % 2 ? "bg-secondary/30" : ""}>
                <td className="text-muted-foreground p-3 text-xs font-medium tracking-wide uppercase">
                  {row.label}
                </td>
                {items.map((l) => (
                  <td
                    key={l.id}
                    className="p-3 text-sm font-medium capitalize"
                  >
                    {row.get(l)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
