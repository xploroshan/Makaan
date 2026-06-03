"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import type { OfferStatus, OfferWithApplicant } from "@/lib/types/connect";

const STATUS_STYLE: Record<OfferStatus, string> = {
  submitted: "bg-accent text-accent-foreground",
  accepted: "bg-primary/15 text-primary",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40",
  declined: "bg-secondary text-muted-foreground",
  withdrawn: "bg-secondary text-muted-foreground",
};

export default function OwnerApplicationsPage() {
  const [offers, setOffers] = useState<OfferWithApplicant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      setOffers(await apiFetch<OfferWithApplicant[]>("/api/v1/owner/offers"));
    } catch (e) {
      setError(
        e instanceof ApiClientError && e.code === "unauthenticated"
          ? "Please sign in to review applications."
          : "Could not load applications.",
      );
    }
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  async function act(id: string, status: OfferStatus, note: string) {
    setMsg(null);
    try {
      await apiFetch(`/api/v1/offers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMsg(note);
      await load();
    } catch (e) {
      setMsg(e instanceof ApiClientError ? e.message : "Action failed.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications received</h1>
        <Link href="/owner/dashboard" className="text-primary text-sm underline">
          ← Dashboard
        </Link>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">
        Review offers, accept the right applicant, and finalise to close the
        deal — your listing flips to rented/sold automatically.
      </p>

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-6 rounded-md border p-4 text-sm">
          {error}
        </p>
      )}
      {msg && (
        <p className="bg-accent/40 mt-4 rounded-md border p-3 text-sm">{msg}</p>
      )}

      {offers && offers.length === 0 && (
        <p className="text-muted-foreground mt-8 text-sm">
          No applications yet. They&apos;ll appear here as seekers apply.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {offers?.map((o) => (
          <Card key={o.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/listings/${o.listing_id}`}
                    className="font-medium hover:underline"
                  >
                    {o.listing_title ?? "Listing"}
                  </Link>
                  <div className="text-muted-foreground mt-1 text-sm">
                    From{" "}
                    <Link
                      href={`/seekers/${o.applicant_id}`}
                      className="text-primary underline"
                    >
                      {o.applicant_name ?? "an applicant"}
                    </Link>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[o.status]}`}
                >
                  {o.status}
                </span>
              </div>

              <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="text-foreground font-semibold">
                  {formatPrice(o.offer_price)}
                  {o.transaction_type !== "sale" && "/mo"}
                </span>
                {o.deposit != null && <span>Deposit {formatPrice(o.deposit)}</span>}
                {o.move_in && <span>From {o.move_in}</span>}
                {o.duration_months && <span>{o.duration_months} months</span>}
              </div>
              {o.message && (
                <p className="text-muted-foreground mt-2 text-sm">
                  “{o.message}”
                </p>
              )}

              {(o.status === "submitted" || o.status === "accepted") && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {o.status === "submitted" && (
                    <Button
                      size="sm"
                      onClick={() => act(o.id, "accepted", "Application accepted.")}
                    >
                      Accept
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      act(o.id, "completed", "Deal finalised — listing updated.")
                    }
                  >
                    Finalise deal
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => act(o.id, "declined", "Application declined.")}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
