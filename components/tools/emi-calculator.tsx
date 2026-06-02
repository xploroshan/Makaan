"use client";

import { useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { emi, totalPayable } from "@/lib/finance";
import { formatPrice } from "@/lib/format";

/** Home-loan EMI calculator. Optionally seeded with a listing's price. */
export function EmiCalculator({ price }: { price?: number | null }) {
  const base = price && price > 0 ? price : 5_000_000;
  const [amount, setAmount] = useState(base);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const loan = Math.max(0, Math.round(amount * (1 - downPct / 100)));
  const months = years * 12;

  const monthly = useMemo(() => emi(loan, rate, months), [loan, rate, months]);
  const total = totalPayable(monthly, months);
  const interest = Math.max(0, total - loan);

  return (
    <div className="bg-card shadow-soft rounded-2xl border p-6">
      <h3 className="text-lg font-semibold">EMI calculator</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Estimate your monthly home-loan instalment.
      </p>

      <div className="mt-5 space-y-5">
        <Field
          label="Property price"
          value={formatPrice(amount)}
          min={500_000}
          max={200_000_000}
          step={100_000}
          raw={amount}
          onChange={setAmount}
        />
        <Field
          label="Down payment"
          value={`${downPct}% · ${formatPrice(Math.round(amount * (downPct / 100)))}`}
          min={0}
          max={90}
          step={1}
          raw={downPct}
          onChange={setDownPct}
        />
        <Field
          label="Interest rate"
          value={`${rate.toFixed(1)}% p.a.`}
          min={5}
          max={15}
          step={0.1}
          raw={rate}
          onChange={setRate}
        />
        <Field
          label="Tenure"
          value={`${years} years`}
          min={1}
          max={30}
          step={1}
          raw={years}
          onChange={setYears}
        />
      </div>

      <div className="border-primary/20 bg-primary/5 mt-6 rounded-xl border p-5 text-center">
        <div className="text-muted-foreground text-xs tracking-wide uppercase">
          Monthly EMI
        </div>
        <div className="text-primary mt-1 text-3xl font-bold">
          {formatPrice(Math.round(monthly))}
        </div>
        <div className="text-muted-foreground mt-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-foreground font-semibold">
              {formatPrice(loan)}
            </div>
            Loan amount
          </div>
          <div>
            <div className="text-foreground font-semibold">
              {formatPrice(Math.round(interest))}
            </div>
            Total interest
          </div>
          <div>
            <div className="text-foreground font-semibold">
              {formatPrice(Math.round(total))}
            </div>
            Total payable
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  min,
  max,
  step,
  raw,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  raw: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={raw}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary mt-2 w-full cursor-pointer"
      />
    </div>
  );
}
