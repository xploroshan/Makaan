import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

/**
 * Server-rendered filter bar. Submits as a GET form so search works without
 * JavaScript and every result page is shareable/SEO-friendly. Amenities and the
 * list/map view are carried through as hidden fields so they survive a submit.
 */
export function SearchFilters({
  defaults,
}: {
  defaults: Record<string, string | undefined>;
}) {
  return (
    <form
      method="get"
      className="bg-card shadow-soft rounded-2xl border p-4 sm:p-5"
    >
      <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
        <SlidersHorizontal className="size-4" />
        Filters
      </div>

      {/* Preserve amenity chips + the list/map view across a submit. */}
      <input type="hidden" name="amenities" value={defaults.amenities ?? ""} />
      {defaults.view && (
        <input type="hidden" name="view" value={defaults.view} />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <Label htmlFor="q" className="text-muted-foreground text-xs">
            Keyword
          </Label>
          <Input
            id="q"
            name="q"
            defaultValue={defaults.q}
            placeholder="e.g. sea-facing, near metro"
            className="mt-1"
          />
        </div>
        <Field label="City">
          <Input
            name="city"
            defaultValue={defaults.city}
            placeholder="Bengaluru"
            className="mt-1"
          />
        </Field>
        <Field label="Pincode">
          <Input
            name="pincode"
            defaultValue={defaults.pincode}
            placeholder="560034"
            inputMode="numeric"
            className="mt-1"
          />
        </Field>
        <Field label="Type">
          <Select
            name="transaction_type"
            defaultValue={defaults.transaction_type ?? ""}
            className="mt-1"
          >
            <option value="">Any</option>
            <option value="rent">Rent</option>
            <option value="lease">Lease</option>
            <option value="coliving">Co-living</option>
            <option value="sale">Sale</option>
          </Select>
        </Field>
        <Field label="Property">
          <Select
            name="property_type"
            defaultValue={defaults.property_type ?? ""}
            className="mt-1"
          >
            <option value="">Any</option>
            <option value="flat">Flat / Apartment</option>
            <option value="house">House / Villa</option>
            <option value="land">Land / Plot</option>
            <option value="commercial">Commercial</option>
          </Select>
        </Field>
        <Field label="BHK">
          <Select name="bhk" defaultValue={defaults.bhk ?? ""} className="mt-1">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} BHK
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Furnishing">
          <Select
            name="furnishing"
            defaultValue={defaults.furnishing ?? ""}
            className="mt-1"
          >
            <option value="">Any</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi">Semi-furnished</option>
            <option value="full">Fully furnished</option>
          </Select>
        </Field>
        <Field label="Min price">
          <Input
            name="price_min"
            defaultValue={defaults.price_min}
            placeholder="₹"
            inputMode="numeric"
            className="mt-1"
          />
        </Field>
        <Field label="Max price">
          <Input
            name="price_max"
            defaultValue={defaults.price_max}
            placeholder="₹"
            inputMode="numeric"
            className="mt-1"
          />
        </Field>
        <Field label="Sort">
          <Select
            name="sort"
            defaultValue={defaults.sort ?? "newest"}
            className="mt-1"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </Select>
        </Field>
        <div className="col-span-2 flex items-end sm:col-span-1">
          <Button type="submit" className="w-full">
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  );
}
