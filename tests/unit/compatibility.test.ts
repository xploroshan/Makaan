import { describe, expect, it } from "vitest";

import { scoreCompatibility, type LifestyleTraits } from "@/lib/compatibility";

const tidy: LifestyleTraits = {
  schedule: "early_bird",
  food: "veg",
  cleanliness: "very_tidy",
  smoking: false,
  pets: false,
  guests: "rarely",
};

describe("scoreCompatibility", () => {
  it("scores identical lifestyles at 100", () => {
    const r = scoreCompatibility(tidy, tidy);
    expect(r.score).toBe(100);
    expect(r.rated).toBe(6);
    expect(r.factors.every((f) => f.match === "match")).toBe(true);
  });

  it("scores opposites low", () => {
    const opposite: LifestyleTraits = {
      schedule: "night_owl",
      food: "non_veg",
      cleanliness: "relaxed",
      smoking: true,
      pets: true,
      guests: "often",
    };
    const r = scoreCompatibility(tidy, opposite);
    // schedule mismatch, food mismatch, cleanliness mismatch, smoking mismatch,
    // pets partial (0.5), guests mismatch -> 0.5/6 ≈ 8
    expect(r.score).toBeLessThan(20);
    expect(r.factors.find((f) => f.key === "pets")?.match).toBe("partial");
  });

  it("treats flexible schedule and veg variants as partial", () => {
    const r = scoreCompatibility(
      { schedule: "early_bird", food: "veg" },
      { schedule: "flexible", food: "vegan" },
    );
    expect(r.factors.find((f) => f.key === "schedule")?.match).toBe("partial");
    expect(r.factors.find((f) => f.key === "food")?.match).toBe("partial");
    expect(r.rated).toBe(2);
    expect(r.score).toBe(50);
  });

  it("excludes unanswered dimensions from the score", () => {
    const r = scoreCompatibility({ food: "veg" }, { food: "veg" });
    expect(r.rated).toBe(1);
    expect(r.score).toBe(100);
    expect(r.factors.filter((f) => f.match === "unknown")).toHaveLength(5);
  });

  it("returns 0 with no shared answers", () => {
    expect(scoreCompatibility({}, {}).score).toBe(0);
  });
});
