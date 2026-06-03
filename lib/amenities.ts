/** Canonical amenity catalogue (pure data, safe to import anywhere). */

export const AMENITIES = [
  { key: "wifi", label: "Wi-Fi" },
  { key: "ac", label: "Air conditioning" },
  { key: "parking", label: "Parking" },
  { key: "power_backup", label: "Power backup" },
  { key: "lift", label: "Lift / elevator" },
  { key: "security", label: "24×7 security" },
  { key: "cctv", label: "CCTV" },
  { key: "gym", label: "Gym" },
  { key: "pool", label: "Swimming pool" },
  { key: "food", label: "Meals included" },
  { key: "housekeeping", label: "Housekeeping" },
  { key: "laundry", label: "Laundry" },
  { key: "water_supply", label: "24×7 water" },
  { key: "gas_pipeline", label: "Piped gas" },
  { key: "garden", label: "Garden / park" },
  { key: "pet_friendly", label: "Pet friendly" },
  { key: "wheelchair", label: "Wheelchair access" },
  { key: "modular_kitchen", label: "Modular kitchen" },
] as const;

export type AmenityKey = (typeof AMENITIES)[number]["key"];

export const AMENITY_KEYS = AMENITIES.map((a) => a.key) as [
  AmenityKey,
  ...AmenityKey[],
];

export const AMENITY_LABEL: Record<string, string> = Object.fromEntries(
  AMENITIES.map((a) => [a.key, a.label]),
);

export function amenityLabel(key: string): string {
  return AMENITY_LABEL[key] ?? key;
}
