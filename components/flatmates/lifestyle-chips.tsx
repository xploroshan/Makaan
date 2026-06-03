import type { LifestyleTraits } from "@/lib/compatibility";

const LABELS: Record<string, Record<string, string>> = {
  schedule: {
    early_bird: "Early bird",
    night_owl: "Night owl",
    flexible: "Flexible hours",
  },
  food: {
    veg: "Vegetarian",
    non_veg: "Non-veg",
    eggetarian: "Eggetarian",
    vegan: "Vegan",
  },
  cleanliness: {
    relaxed: "Relaxed",
    moderate: "Moderately tidy",
    very_tidy: "Very tidy",
  },
  guests: {
    rarely: "Few guests",
    sometimes: "Some guests",
    often: "Frequent guests",
  },
};

/** Human-friendly chips summarising a person's lifestyle. */
export function LifestyleChips({
  lifestyle,
  className,
}: {
  lifestyle: LifestyleTraits | null;
  className?: string;
}) {
  if (!lifestyle) return null;
  const chips: string[] = [];
  if (lifestyle.schedule) chips.push(LABELS.schedule[lifestyle.schedule] ?? lifestyle.schedule);
  if (lifestyle.food) chips.push(LABELS.food[lifestyle.food] ?? lifestyle.food);
  if (lifestyle.cleanliness)
    chips.push(LABELS.cleanliness[lifestyle.cleanliness] ?? lifestyle.cleanliness);
  if (lifestyle.smoking != null)
    chips.push(lifestyle.smoking ? "Smoker" : "Non-smoker");
  if (lifestyle.pets != null)
    chips.push(lifestyle.pets ? "Pet-friendly" : "No pets");
  if (lifestyle.guests) chips.push(LABELS.guests[lifestyle.guests] ?? lifestyle.guests);

  if (chips.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {chips.map((c) => (
        <span
          key={c}
          className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs"
        >
          {c}
        </span>
      ))}
    </div>
  );
}
