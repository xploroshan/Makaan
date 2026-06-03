import { describe, expect, it } from "vitest";

import {
  canSetOfferStatus,
  listingStatusForCompletedOffer,
} from "@/lib/services/offers";

describe("listingStatusForCompletedOffer", () => {
  it("sells on sale, rents otherwise", () => {
    expect(listingStatusForCompletedOffer("sale")).toBe("sold");
    expect(listingStatusForCompletedOffer("rent")).toBe("rented");
    expect(listingStatusForCompletedOffer("lease")).toBe("rented");
    expect(listingStatusForCompletedOffer("coliving")).toBe("rented");
  });
});

describe("canSetOfferStatus", () => {
  it("lets an applicant only withdraw", () => {
    expect(canSetOfferStatus("applicant", "withdrawn")).toBe(true);
    expect(canSetOfferStatus("applicant", "accepted")).toBe(false);
    expect(canSetOfferStatus("applicant", "completed")).toBe(false);
  });

  it("lets an owner accept, decline or finalise — not withdraw", () => {
    expect(canSetOfferStatus("owner", "accepted")).toBe(true);
    expect(canSetOfferStatus("owner", "declined")).toBe(true);
    expect(canSetOfferStatus("owner", "completed")).toBe(true);
    expect(canSetOfferStatus("owner", "withdrawn")).toBe(false);
  });
});
