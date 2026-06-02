import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

/**
 * Server-rendered filter bar. Submits as a GET form so search works without
 * JavaScript and every result page is shareable/SEO-friendly.
 */
export function SearchFilters({
  defaults,
}: {
  defaults: Record<string, string | undefined>;
}) {
  return (
    <form
      method="get"
      className="bg-card grid grid-cols-2 gap-3 rounded-lg border p-4 sm:grid-cols-3 lg:grid-cols-6"
    >
      <div className="col-span-2 sm:col-span-3 lg:col-span-2">
        <Label htmlFor="q">Keyword</Label>
        <Input
          id="q"
          name="q"
          defaultValue={defaults.q}
          placeholder="e.g. sea-facing, near metro"
        />
      </div>
      <div>
        <Label htmlFor="pincode">Pincode</Label>
        <Input
          id="pincode"
          name="pincode"
          defaultValue={defaults.pincode}
          placeholder="560034"
          inputMode="numeric"
        />
      </div>
      <div>
        <Label htmlFor="transaction_type">Type</Label>
        <Select
          id="transaction_type"
          name="transaction_type"
          defaultValue={defaults.transaction_type ?? ""}
        >
          <option value="">Any</option>
          <option value="rent">Rent</option>
          <option value="lease">Lease</option>
          <option value="coliving">Co-living</option>
          <option value="sale">Sale</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="bhk">BHK</Label>
        <Select id="bhk" name="bhk" defaultValue={defaults.bhk ?? ""}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} BHK
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="sort">Sort</Label>
        <Select id="sort" name="sort" defaultValue={defaults.sort ?? "newest"}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </Select>
      </div>
      <div className="col-span-2 flex items-end sm:col-span-1">
        <Button type="submit" className="w-full">
          Search
        </Button>
      </div>
    </form>
  );
}
