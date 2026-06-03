import {
  Accessibility,
  ArrowUpDown,
  BatteryCharging,
  Car,
  Cctv,
  ChefHat,
  Droplets,
  Dumbbell,
  Flame,
  type LucideIcon,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Shirt,
  Trees,
  Utensils,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";

import { AMENITIES, amenityLabel } from "@/lib/amenities";

export const AMENITY_ICON: Record<string, LucideIcon> = {
  wifi: Wifi,
  ac: Wind,
  parking: Car,
  power_backup: BatteryCharging,
  lift: ArrowUpDown,
  security: ShieldCheck,
  cctv: Cctv,
  gym: Dumbbell,
  pool: Waves,
  food: Utensils,
  housekeeping: Sparkles,
  laundry: Shirt,
  water_supply: Droplets,
  gas_pipeline: Flame,
  garden: Trees,
  pet_friendly: PawPrint,
  wheelchair: Accessibility,
  modular_kitchen: ChefHat,
};

/** Read-only amenities grid for the listing detail page. */
export function AmenitiesGrid({ amenities }: { amenities: string[] }) {
  const known = amenities.filter((a) => AMENITY_ICON[a]);
  if (known.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {known.map((key) => {
        const Icon = AMENITY_ICON[key];
        return (
          <div
            key={key}
            className="bg-card shadow-soft flex items-center gap-2.5 rounded-xl border p-3"
          >
            <Icon className="text-primary size-5 shrink-0" />
            <span className="text-sm font-medium">{amenityLabel(key)}</span>
          </div>
        );
      })}
    </dl>
  );
}

export { AMENITIES };
