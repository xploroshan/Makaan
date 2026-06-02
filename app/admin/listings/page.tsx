"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { useAdminList } from "@/lib/hooks/use-admin-list";

interface AdminListing {
  id: string;
  transaction_type: string;
  property_type: string;
  status: string;
  title: string | null;
  price: number | null;
  featured: boolean;
}

const ACTIONS = [
  ["approve", "Approve"],
  ["pause", "Pause"],
  ["reject", "Reject"],
  ["expire", "Expire"],
  ["feature", "Feature"],
  ["unfeature", "Unfeature"],
  ["remove", "Remove"],
] as const;

export default function AdminListingsPage() {
  const { data, error, reload } = useAdminList<AdminListing>(
    "/api/v1/admin/listings",
  );

  async function moderate(id: string, action: string) {
    await apiFetch(`/api/v1/admin/listings/${id}/moderate`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    reload();
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Listings moderation</h1>
      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
      <div className="mt-6 space-y-3">
        {data?.map((l) => (
          <div key={l.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={`/listings/${l.id}`}
                  className="font-medium hover:underline"
                >
                  {l.title ?? "Untitled"}
                </Link>
                <div className="text-muted-foreground text-sm">
                  {l.transaction_type} · {l.property_type} ·{" "}
                  {formatPrice(l.price)}
                </div>
              </div>
              <div className="flex gap-1">
                <Badge variant="outline">{l.status}</Badge>
                {l.featured && <Badge>featured</Badge>}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {ACTIONS.map(([action, label]) => (
                <Button
                  key={action}
                  size="sm"
                  variant={action === "remove" ? "destructive" : "outline"}
                  onClick={() => moderate(l.id, action)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="text-muted-foreground text-sm">No listings.</p>
        )}
      </div>
    </section>
  );
}
