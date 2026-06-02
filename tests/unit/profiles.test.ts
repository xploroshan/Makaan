import { describe, expect, it } from "vitest";

import { applySeekerPrivacy, normalizePrivacy } from "@/lib/services/profiles";
import { deriveTrustBadges } from "@/lib/services/verifications";
import { registerAgentSchema, agentReviewSchema } from "@/lib/validation/agent";
import type { LifestyleProfile, SeekerProfile } from "@/lib/types/profile";

const seeker: SeekerProfile = {
  user_id: "u1",
  bio: "Hello",
  city: "Pune",
  occupation: "Engineer",
  is_student: false,
  languages: ["en", "hi"],
  privacy: { show_bio: true, show_occupation: true, show_lifestyle: true },
};

const lifestyle: LifestyleProfile = {
  user_id: "u1",
  schedule: "night_owl",
  food: "veg",
  cleanliness: "very_tidy",
  smoking: false,
  pets: true,
  guests: "rarely",
  gender_pref: "any",
};

describe("normalizePrivacy", () => {
  it("fills missing flags with defaults", () => {
    expect(normalizePrivacy({ show_bio: false })).toEqual({
      show_bio: false,
      show_occupation: true,
      show_lifestyle: true,
    });
  });
  it("defaults everything for null", () => {
    expect(normalizePrivacy(null).show_lifestyle).toBe(true);
  });
});

describe("applySeekerPrivacy", () => {
  const trust = { identityVerified: false, ownershipVerified: false };

  it("shows public fields when allowed", () => {
    const p = applySeekerPrivacy({
      userId: "u1",
      name: "Sam",
      seeker,
      lifestyle,
      trust,
    });
    expect(p.bio).toBe("Hello");
    expect(p.occupation).toBe("Engineer");
    expect(p.lifestyle).not.toBeNull();
  });

  it("hides fields the seeker marked private", () => {
    const p = applySeekerPrivacy({
      userId: "u1",
      name: "Sam",
      seeker: {
        ...seeker,
        privacy: {
          show_bio: false,
          show_occupation: false,
          show_lifestyle: false,
        },
      },
      lifestyle,
      trust,
    });
    expect(p.bio).toBeNull();
    expect(p.occupation).toBeNull();
    expect(p.lifestyle).toBeNull();
    // Non-private fields remain visible.
    expect(p.city).toBe("Pune");
    expect(p.languages).toEqual(["en", "hi"]);
  });
});

describe("deriveTrustBadges", () => {
  it("only counts verified records", () => {
    const badges = deriveTrustBadges([
      { type: "identity", status: "verified" },
      { type: "ownership", status: "pending" },
    ]);
    expect(badges).toEqual({
      identityVerified: true,
      ownershipVerified: false,
    });
  });
});

describe("agent validation", () => {
  it("requires a business name", () => {
    expect(registerAgentSchema.safeParse({ business_name: "A" }).success).toBe(
      false,
    );
    expect(
      registerAgentSchema.safeParse({ business_name: "Acme Realty" }).success,
    ).toBe(true);
  });
  it("bounds review ratings to 1-5", () => {
    expect(agentReviewSchema.safeParse({ rating: 5 }).success).toBe(true);
    expect(agentReviewSchema.safeParse({ rating: 6 }).success).toBe(false);
    expect(agentReviewSchema.safeParse({ rating: 0 }).success).toBe(false);
  });
});
