"use client";

import Link from "next/link";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { affordableRent } from "@/lib/finance";
import { formatPrice } from "@/lib/format";

/** Rent affordability helper: recommends a budget from monthly income. */
export function RentAffordability({ income = 80_000 }: { income?: number }) {
  const [value, setValue] = useState(income);
  const { recommended, ceiling } = affordableRent(value);

  return (
    <div className="bg-card shadow-soft rounded-2xl border p-6">
      <h3 className="text-lg font-semibold">Rent affordability</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        A comfortable rent is around 30% of your monthly income.
      </p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <Label>Monthly income</Label>
          <span className="text-sm font-semibold">{formatPrice(value)}</span>
        </div>
        <input
          type="range"
          min={15_000}
          max={1_000_000}
          step={5_000}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="accent-primary mt-2 w-full cursor-pointer"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="border-primary/20 bg-primary/5 rounded-xl border p-4 text-center">
          <div className="text-muted-foreground text-xs tracking-wide uppercase">
            Recommended
          </div>
          <div className="text-primary mt-1 text-2xl font-bold">
            {formatPrice(recommended)}
          </div>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <div className="text-muted-foreground text-xs tracking-wide uppercase">
            Stretch ceiling
          </div>
          <div className="mt-1 text-2xl font-bold">{formatPrice(ceiling)}</div>
        </div>
      </div>

      <Link
        href={`/search?transaction_type=rent&price_max=${ceiling}`}
        className="text-primary mt-4 inline-block text-sm underline"
      >
        See rentals within budget →
      </Link>
    </div>
  );
}
