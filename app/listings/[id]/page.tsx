import {
  ArrowLeft,
  Bed,
  CalendarDays,
  Hash,
  Image as ImageIcon,
  MapPin,
  Maximize,
  Sofa,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompareToggle } from "@/components/compare/compare-toggle";
import { InterestButton } from "@/components/listings/interest-button";
import { ListingCard } from "@/components/listings/listing-card";
import { RecentlyViewedTracker } from "@/components/recently-viewed";
import { SaveButton } from "@/components/shortlist/save-button";
import { EmiCalculator } from "@/components/tools/emi-calculator";
import { RentAffordability } from "@/components/tools/rent-affordability";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { ApiError } from "@/lib/api/errors";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { formatArea, formatPrice, transactionLabel } from "@/lib/format";
import { hasRevealedContact } from "@/lib/services/enquiries";
import { resolveTemplate } from "@/lib/services/form-templates";
import { getListingDetail } from "@/lib/services/listings";
import { listListingRatings } from "@/lib/services/ratings";
import type { RatingWithAuthor } from "@/lib/services/ratings";
import { similarListings } from "@/lib/services/recommendations";
import type { ListingDetail, ListingSummary } from "@/lib/types/listing";

type Params = { id: string };

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  let listing: ListingDetail;
  let labels: Record<string, string> = {};
  let ratings: RatingWithAuthor[] = [];
  let similar: ListingSummary[] = [];
  let isOwner = false;
  try {
    const viewer = await getSessionUser();
    const supabase = await createSupabaseServerClient();
    const revealed = viewer
      ? await hasRevealedContact(supabase, id, viewer.id)
      : false;
    listing = await getListingDetail(
      supabase,
      id,
      viewer?.id ?? null,
      revealed,
    );
    isOwner = viewer?.id === listing.owner_id;

    if (!isOwner) {
      await supabase.rpc("increment_listing_view", { p_listing: id });
    }

    const [template, ratingList] = await Promise.all([
      resolveTemplate(
        supabase,
        listing.transaction_type,
        listing.property_type,
      ),
      listListingRatings(supabase, id),
    ]);
    labels = Object.fromEntries(
      (template?.fields ?? []).map((f) => [f.key, f.label]),
    );
    ratings = ratingList;

    similar = await similarListings(supabase, {
      id,
      transaction_type: listing.transaction_type,
      property_type: listing.property_type,
      price: listing.price,
      city: listing.location?.city ?? null,
      pincode: listing.location?.pincode ?? null,
    });
  } catch (err) {
    if (err instanceof ApiError && err.code === "not_found") notFound();
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="border-warning/40 bg-warning/10 rounded-xl border p-4 text-sm">
          This listing can’t be loaded. Configure Supabase and apply the
          migrations to view live data.
        </p>
      </main>
    );
  }

  const place = [listing.location?.locality, listing.location?.city]
    .filter(Boolean)
    .join(", ");
  const photos = listing.media.filter((m) => m.type === "photo");
  const summary: ListingSummary = {
    id: listing.id,
    transaction_type: listing.transaction_type,
    property_type: listing.property_type,
    title: listing.title,
    price: listing.price,
    bhk: listing.bhk,
    area_sqft: listing.area_sqft,
    furnishing: listing.furnishing,
    locality: listing.location?.locality ?? null,
    city: listing.location?.city ?? null,
    pincode: listing.location?.pincode ?? null,
    cover_url: photos[0]?.url ?? null,
    created_at: listing.created_at,
  };
  const isSale = listing.transaction_type === "sale";
  const avg =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0;

  const facts = [
    { icon: Bed, label: "BHK", value: listing.bhk ? `${listing.bhk}` : "—" },
    { icon: Maximize, label: "Area", value: formatArea(listing.area_sqft) },
    {
      icon: Sofa,
      label: "Furnishing",
      value: listing.furnishing ?? "—",
    },
    {
      icon: Wallet,
      label: "Deposit",
      value: listing.deposit ? formatPrice(listing.deposit) : "—",
    },
    {
      icon: CalendarDays,
      label: "Available",
      value: listing.available_from ?? "—",
    },
    { icon: Hash, label: "Pincode", value: listing.location?.pincode ?? "—" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
      <RecentlyViewedTracker listing={summary} />
      <Link
        href="/search"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Back to search
      </Link>

      {/* Gallery */}
      <div className="mt-4 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-2xl sm:col-span-3 sm:row-span-2 sm:aspect-auto">
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photos[0].url}
              alt={listing.title ?? "Property"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="from-primary/15 to-gold/10 flex h-full w-full items-center justify-center bg-gradient-to-br">
              <ImageIcon className="text-primary/40 size-10" />
            </div>
          )}
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-muted relative hidden aspect-[16/10] overflow-hidden rounded-2xl sm:block"
          >
            {photos[i] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[i].url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="from-primary/10 to-gold/5 flex h-full w-full items-center justify-center bg-gradient-to-br">
                <ImageIcon className="text-primary/30 size-6" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-accent text-accent-foreground">
              {transactionLabel(listing.transaction_type)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {listing.property_type}
            </Badge>
            {ratings.length > 0 && <Stars value={avg} count={ratings.length} />}
          </div>

          <h1 className="mt-3 text-3xl font-bold">
            {listing.title ?? "Untitled listing"}
          </h1>
          {place && (
            <p className="text-muted-foreground mt-2 flex items-center gap-1.5">
              <MapPin className="size-4" /> {place}
            </p>
          )}

          {/* Fact tiles */}
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map((f) => (
              <div
                key={f.label}
                className="bg-card shadow-soft rounded-xl border p-4"
              >
                <f.icon className="text-primary size-4" />
                <dt className="text-muted-foreground mt-2 text-xs tracking-wide uppercase">
                  {f.label}
                </dt>
                <dd className="font-semibold capitalize">{f.value}</dd>
              </div>
            ))}
          </dl>

          {listing.description && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold">About this property</h2>
              <p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </section>
          )}

          {Object.keys(listing.attributes).length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold">Details</h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                {Object.entries(listing.attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="border-border/60 flex flex-col border-b pb-2"
                  >
                    <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                      {labels[key] ?? key}
                    </dt>
                    <dd className="text-sm font-medium">{renderAttr(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="mt-10">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                Ratings ({ratings.length})
              </h2>
              {ratings.length > 0 && <Stars value={avg} />}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Only seekers who completed a visit can rate — no fake reviews.
            </p>
            <div className="mt-4 space-y-3">
              {ratings.length === 0 && (
                <p className="text-muted-foreground text-sm">No ratings yet.</p>
              )}
              {ratings.map((r) => (
                <div
                  key={r.id}
                  className="bg-card shadow-soft rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {r.author_name ?? "A visitor"}
                    </span>
                    <Stars value={r.rating} />
                  </div>
                  {r.review && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      {r.review}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold">Plan your budget</h2>
            <div className="mt-4">
              {isSale ? (
                <EmiCalculator price={listing.price} />
              ) : (
                <RentAffordability />
              )}
            </div>
          </section>
        </div>

        {/* Sticky contact card */}
        <aside>
          <div className="bg-card shadow-lift rounded-2xl border p-6 lg:sticky lg:top-20">
            <div className="text-muted-foreground text-sm">
              {transactionLabel(listing.transaction_type)}
            </div>
            <div className="text-primary mt-1 text-3xl font-bold">
              {formatPrice(listing.price)}
            </div>
            <div className="bg-border my-5 h-px" />
            <p className="text-muted-foreground text-sm">
              Contact details are shared only after the owner accepts your
              interest — zero spam, ever.
            </p>
            <div className="mt-4">
              {isOwner ? (
                <p className="bg-secondary rounded-lg px-4 py-3 text-center text-sm font-medium">
                  This is your listing.
                </p>
              ) : (
                <InterestButton listingId={listing.id} />
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <SaveButton listingId={listing.id} withLabel className="flex-1 justify-center" />
              <CompareToggle listing={summary} />
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-semibold">Similar homes</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            More {transactionLabel(listing.transaction_type).toLowerCase()}{" "}
            options in {listing.location?.city ?? "the area"}.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function renderAttr(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value == null) return "—";
  return String(value);
}
