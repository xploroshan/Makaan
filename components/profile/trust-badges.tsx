import { BadgeCheck, Home } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { TrustBadges as TrustBadgeData } from "@/lib/types/profile";

export function TrustBadges({ trust }: { trust: TrustBadgeData }) {
  if (!trust.identityVerified && !trust.ownershipVerified) {
    return (
      <span className="text-muted-foreground text-xs">Not yet verified</span>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {trust.identityVerified && (
        <Badge variant="success" className="gap-1">
          <BadgeCheck className="size-3.5" /> ID verified
        </Badge>
      )}
      {trust.ownershipVerified && (
        <Badge variant="success" className="gap-1">
          <Home className="size-3.5" /> Ownership verified
        </Badge>
      )}
    </div>
  );
}
