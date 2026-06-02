import Link from "next/link";
import { Bed, MapPin, Maximize } from "lucide-react";

import { CompareToggle } from "@/components/compare/compare-toggle";
import { SaveButton } from "@/components/shortlist/save-button";
import { Badge } from "@/components/ui/badge";
import { formatArea, formatPrice, transactionLabel } from "@/lib/format";
import type { ListingSummary } from "@/lib/types/listing";

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const place = [listing.locality, listing.city].filter(Boolean).join(", ");
  return (
    <article className="group bg-card shadow-soft hover:shadow-lift relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1">
      {/* Overlay controls sit above the stretched link. */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <CompareToggle listing={listing} />
        <SaveButton listingId={listing.id} />
      </div>
      {/* Stretched link makes the whole card clickable without nesting buttons. */}
      <Link
        href={`/listings/${listing.id}`}
        className="absolute inset-0 z-10"
        aria-label={listing.title ?? "View listing"}
      />
      <div className="relative aspect-[4/3] overflow-hidden">
        {listing.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.cover_url}
            alt={listing.title ?? "Property photo"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="from-primary/15 to-gold/10 flex h-full w-full items-center justify-center bg-gradient-to-br">
            <MapPin className="text-primary/40 size-8" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <Badge className="bg-background/85 text-foreground shadow-soft absolute top-3 left-3 backdrop-blur">
          {transactionLabel(listing.transaction_type)}
        </Badge>
        <div className="absolute bottom-3 left-3 text-lg font-bold text-white drop-shadow">
          {formatPrice(listing.price)}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 font-semibold">
          {listing.title ?? "Untitled listing"}
        </h3>
        {place && (
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <MapPin className="size-3.5" />
            <span className="line-clamp-1">{place}</span>
          </div>
        )}
        <div className="text-muted-foreground flex flex-wrap gap-3 pt-1 text-sm">
          {listing.bhk ? (
            <span className="inline-flex items-center gap-1">
              <Bed className="size-3.5" /> {listing.bhk} BHK
            </span>
          ) : null}
          {listing.area_sqft ? (
            <span className="inline-flex items-center gap-1">
              <Maximize className="size-3.5" /> {formatArea(listing.area_sqft)}
            </span>
          ) : null}
          {listing.furnishing ? (
            <span className="capitalize">{listing.furnishing}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
