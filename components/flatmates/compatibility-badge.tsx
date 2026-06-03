import { Check, Minus, X } from "lucide-react";

import type { CompatibilityResult, FactorMatch } from "@/lib/compatibility";

function tone(score: number): { ring: string; text: string; label: string } {
  if (score >= 75)
    return {
      ring: "border-emerald-500 text-emerald-600",
      text: "text-emerald-600",
      label: "Great match",
    };
  if (score >= 50)
    return {
      ring: "border-amber-500 text-amber-600",
      text: "text-amber-600",
      label: "Decent match",
    };
  return {
    ring: "border-rose-400 text-rose-500",
    text: "text-rose-500",
    label: "Low match",
  };
}

/** Circular compatibility score. */
export function CompatibilityBadge({
  result,
  size = "md",
}: {
  result: CompatibilityResult;
  size?: "sm" | "md";
}) {
  if (result.rated === 0) return null;
  const t = tone(result.score);
  const dim = size === "sm" ? "size-12 text-sm" : "size-16 text-lg";
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex ${dim} flex-col items-center justify-center rounded-full border-2 font-bold ${t.ring}`}
      >
        {result.score}%
      </div>
      {size === "md" && (
        <span className={`mt-1 text-xs font-medium ${t.text}`}>{t.label}</span>
      )}
    </div>
  );
}

const ICON: Record<FactorMatch, React.ReactNode> = {
  match: <Check className="size-4 text-emerald-600" />,
  partial: <Minus className="size-4 text-amber-600" />,
  mismatch: <X className="size-4 text-rose-500" />,
  unknown: <Minus className="text-muted-foreground size-4" />,
};

/** Per-dimension breakdown of a compatibility result. */
export function CompatibilityBreakdown({
  result,
}: {
  result: CompatibilityResult;
}) {
  return (
    <ul className="space-y-2">
      {result.factors
        .filter((f) => f.match !== "unknown")
        .map((f) => (
          <li key={f.key} className="flex items-center gap-2 text-sm">
            {ICON[f.match]}
            <span className="text-muted-foreground">{f.label}</span>
          </li>
        ))}
    </ul>
  );
}
