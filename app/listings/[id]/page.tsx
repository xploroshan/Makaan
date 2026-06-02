import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api/errors";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { formatArea, formatPrice, transactionLabel } from "@/lib/format";
import { resolveTemplate } from "@/lib/services/form-templates";
import { getListingDetail } from "@/lib/services/listings";
import type { ListingDetail } from "@/lib/types/listing";

type Params = { id: string };

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  let listing: ListingDetail;
  let labels: Record<string, string> = {};
  try {
    const viewer = await getSessionUser();
    const supabase = await createSupabaseServerClient();
    listing = await getListingDetail(supabase, id, viewer?.id ?? null);
    const template = await resolveTemplate(
      supabase,
      listing.transaction_type,
      listing.property_type,
    );
    labels = Object.fromEntries(
      (template?.fields ?? []).map((f) => [f.key, f.label]),
    );
  } catch (err) {
    if (err instanceof ApiError && err.code === "not_found") notFound();
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="border-warning/40 bg-warning/10 rounded-md border p-4 text-sm">
          This listing can’t be loaded. Configure Supabase (.env.local) and
          apply the migrations to view live data.
        </p>
      </main>
    );
  }

  const place = [listing.location?.locality, listing.location?.city]
    .filter(Boolean)
    .join(", ");
  const photos = listing.media.filter((m) => m.type === "photo");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      {/* Gallery */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-lg sm:col-span-2">
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photos[0].url}
              alt={listing.title ?? "Property"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              No photos yet
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Key facts */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {transactionLabel(listing.transaction_type)}
            </Badge>
            <Badge variant="outline">{listing.property_type}</Badge>
            <Badge variant="outline">{listing.status}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold">
            {listing.title ?? "Untitled listing"}
          </h1>
          <p className="text-primary mt-1 text-3xl font-semibold">
            {formatPrice(listing.price)}
          </p>
          {place && <p className="text-muted-foreground mt-1">{place}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Fact label="BHK" value={listing.bhk ? `${listing.bhk}` : "—"} />
            <Fact label="Area" value={formatArea(listing.area_sqft)} />
            <Fact label="Furnishing" value={listing.furnishing ?? "—"} />
            <Fact
              label="Deposit"
              value={listing.deposit ? formatPrice(listing.deposit) : "—"}
            />
            <Fact label="Available" value={listing.available_from ?? "—"} />
            <Fact label="Pincode" value={listing.location?.pincode ?? "—"} />
          </dl>

          {listing.description && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">About this property</h2>
              <p className="text-muted-foreground mt-2 whitespace-pre-line">
                {listing.description}
              </p>
            </section>
          )}

          {Object.keys(listing.attributes).length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Details</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(listing.attributes).map(([key, value]) => (
                  <Fact
                    key={key}
                    label={labels[key] ?? key}
                    value={renderAttr(value)}
                  />
                ))}
              </dl>
            </section>
          )}
        </div>

        {/* Contact / connect (consent-based reveal lands in the next slice) */}
        <aside>
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-muted-foreground text-sm">
                Contact details are shared only after the owner accepts your
                interest — zero spam.
              </p>
              <button
                className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2 text-sm font-medium opacity-60"
                disabled
              >
                Express interest (coming soon)
              </button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function renderAttr(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value == null) return "—";
  return String(value);
}
