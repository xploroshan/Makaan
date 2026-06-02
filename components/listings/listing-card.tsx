import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatArea, formatPrice, transactionLabel } from "@/lib/format";
import type { ListingSummary } from "@/lib/types/listing";

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const place = [listing.locality, listing.city].filter(Boolean).join(", ");
  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="bg-muted relative aspect-[4/3]">
          {listing.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.cover_url}
              alt={listing.title ?? "Property photo"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
              No photo
            </div>
          )}
          <Badge variant="secondary" className="absolute top-2 left-2">
            {transactionLabel(listing.transaction_type)}
          </Badge>
        </div>
        <CardContent className="space-y-1 p-4">
          <div className="text-lg font-semibold">
            {formatPrice(listing.price)}
          </div>
          <div className="line-clamp-1 text-sm font-medium">
            {listing.title ?? "Untitled listing"}
          </div>
          <div className="text-muted-foreground text-sm">
            {[
              listing.bhk ? `${listing.bhk} BHK` : null,
              listing.area_sqft ? formatArea(listing.area_sqft) : null,
              listing.furnishing,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {place && (
            <div className="text-muted-foreground text-sm">{place}</div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
