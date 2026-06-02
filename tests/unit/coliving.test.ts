import { describe, expect, it } from "vitest";

import { summariseOccupancy } from "@/lib/services/coliving";

describe("summariseOccupancy", () => {
  it("returns all zeros (and a 0 rate) for no rooms", () => {
    const s = summariseOccupancy([]);
    expect(s).toEqual({
      rooms: 0,
      total_beds: 0,
      occupied_beds: 0,
      vacant_beds: 0,
      occupancy_rate: 0,
    });
  });

  it("sums beds across rooms and computes vacancy", () => {
    const s = summariseOccupancy([
      { total_beds: 2, occupied_beds: 1 },
      { total_beds: 4, occupied_beds: 4 },
      { total_beds: 4, occupied_beds: 0 },
    ]);
    expect(s.rooms).toBe(3);
    expect(s.total_beds).toBe(10);
    expect(s.occupied_beds).toBe(5);
    expect(s.vacant_beds).toBe(5);
    expect(s.occupancy_rate).toBe(0.5);
  });

  it("reports a full house as 100% occupied", () => {
    const s = summariseOccupancy([{ total_beds: 3, occupied_beds: 3 }]);
    expect(s.occupancy_rate).toBe(1);
    expect(s.vacant_beds).toBe(0);
  });
});
