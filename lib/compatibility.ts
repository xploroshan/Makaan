/**
 * Flatmate compatibility scoring (pure, unit-tested). Compares two lifestyle
 * profiles across the dimensions we collect and returns a 0–100 score plus a
 * per-factor breakdown. Dimensions either side hasn't answered are excluded
 * from the score rather than penalised.
 */

export interface LifestyleTraits {
  schedule?: string | null;
  food?: string | null;
  cleanliness?: string | null;
  smoking?: boolean | null;
  pets?: boolean | null;
  guests?: string | null;
}

export type FactorMatch = "match" | "partial" | "mismatch" | "unknown";

export interface CompatibilityFactor {
  key: string;
  label: string;
  match: FactorMatch;
}

export interface CompatibilityResult {
  score: number;
  /** Number of dimensions both people answered. */
  rated: number;
  factors: CompatibilityFactor[];
}

const CLEAN_ORDER = ["relaxed", "moderate", "very_tidy"];
const GUESTS_ORDER = ["rarely", "sometimes", "often"];
const VEG_FOODS = new Set(["veg", "vegan", "eggetarian"]);

const WEIGHT: Record<FactorMatch, number> = {
  match: 1,
  partial: 0.5,
  mismatch: 0,
  unknown: 0,
};

function ordinalMatch(
  order: string[],
  a?: string | null,
  b?: string | null,
): FactorMatch {
  const i = a ? order.indexOf(a) : -1;
  const j = b ? order.indexOf(b) : -1;
  if (i < 0 || j < 0) return "unknown";
  const d = Math.abs(i - j);
  return d === 0 ? "match" : d === 1 ? "partial" : "mismatch";
}

function scheduleMatch(a?: string | null, b?: string | null): FactorMatch {
  if (!a || !b) return "unknown";
  if (a === b) return "match";
  if (a === "flexible" || b === "flexible") return "partial";
  return "mismatch";
}

function foodMatch(a?: string | null, b?: string | null): FactorMatch {
  if (!a || !b) return "unknown";
  if (a === b) return "match";
  return VEG_FOODS.has(a) && VEG_FOODS.has(b) ? "partial" : "mismatch";
}

function boolMatch(
  a?: boolean | null,
  b?: boolean | null,
  partialOnDiffer = false,
): FactorMatch {
  if (a == null || b == null) return "unknown";
  if (a === b) return "match";
  return partialOnDiffer ? "partial" : "mismatch";
}

export function scoreCompatibility(
  a: LifestyleTraits,
  b: LifestyleTraits,
): CompatibilityResult {
  const factors: CompatibilityFactor[] = [
    { key: "schedule", label: "Daily schedule", match: scheduleMatch(a.schedule, b.schedule) },
    { key: "food", label: "Food preference", match: foodMatch(a.food, b.food) },
    {
      key: "cleanliness",
      label: "Cleanliness",
      match: ordinalMatch(CLEAN_ORDER, a.cleanliness, b.cleanliness),
    },
    { key: "smoking", label: "Smoking", match: boolMatch(a.smoking, b.smoking) },
    { key: "pets", label: "Pets", match: boolMatch(a.pets, b.pets, true) },
    {
      key: "guests",
      label: "Guests",
      match: ordinalMatch(GUESTS_ORDER, a.guests, b.guests),
    },
  ];

  const rated = factors.filter((f) => f.match !== "unknown").length;
  if (rated === 0) return { score: 0, rated: 0, factors };

  const sum = factors.reduce((s, f) => s + WEIGHT[f.match], 0);
  return { score: Math.round((sum / rated) * 100), rated, factors };
}
