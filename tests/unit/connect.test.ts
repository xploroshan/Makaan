import { describe, expect, it } from "vitest";

import { screenMessage } from "@/lib/services/chat";
import {
  ratePropertySchema,
  scheduleVisitSchema,
  sendMessageSchema,
} from "@/lib/validation/connect";

describe("screenMessage", () => {
  it("allows normal messages", () => {
    expect(screenMessage("Hi, is this still available?").allowed).toBe(true);
  });

  it("blocks scam patterns", () => {
    expect(
      screenMessage("Please pay the deposit to confirm before visiting")
        .allowed,
    ).toBe(false);
    expect(screenMessage("Send the OTP to verify your booking").allowed).toBe(
      false,
    );
    expect(screenMessage("Pay via western union").allowed).toBe(false);
  });

  it("blocks profanity", () => {
    expect(screenMessage("this is sh*t").allowed).toBe(false);
  });
});

describe("connect validation", () => {
  it("rejects empty messages and bounds length", () => {
    expect(sendMessageSchema.safeParse({ body: "  " }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ body: "hello" }).success).toBe(true);
  });

  it("requires an ISO datetime for visits", () => {
    expect(
      scheduleVisitSchema.safeParse({
        listing_id: "11111111-1111-1111-1111-111111111111",
        slot: "not-a-date",
      }).success,
    ).toBe(false);
    expect(
      scheduleVisitSchema.safeParse({
        listing_id: "11111111-1111-1111-1111-111111111111",
        slot: "2026-07-01T10:00:00+05:30",
      }).success,
    ).toBe(true);
  });

  it("bounds property rating to 1-5", () => {
    const base = {
      visit_id: "11111111-1111-1111-1111-111111111111",
    };
    expect(ratePropertySchema.safeParse({ ...base, rating: 5 }).success).toBe(
      true,
    );
    expect(ratePropertySchema.safeParse({ ...base, rating: 7 }).success).toBe(
      false,
    );
  });
});
