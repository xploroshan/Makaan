"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { OwnerDashboard } from "@/lib/types/connect";

export default function OwnerDashboardPage() {
  const [data, setData] = useState<OwnerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<OwnerDashboard>("/api/v1/owner/dashboard")
      .then(setData)
      .catch((e: unknown) =>
        setError(
          e instanceof ApiClientError && e.code === "unauthenticated"
            ? "Please sign in to view your dashboard."
            : "Could not load the dashboard.",
        ),
      );
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Owner dashboard</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/owner/applications"
            className="text-primary text-sm underline"
          >
            Applications
          </Link>
          <Link
            href="/owner/coliving"
            className="text-primary text-sm underline"
          >
            Co-living occupancy
          </Link>
          <Link
            href="/owner/listings/new"
            className="text-primary text-sm underline"
          >
            + New listing
          </Link>
        </div>
      </div>

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-6 rounded-md border p-4 text-sm">
          {error}
        </p>
      )}

      {data && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Total listings" value={data.listings.total} />
          <Stat label="Active" value={data.listings.active} />
          <Stat label="Rented / sold" value={data.listings.rented_sold} />
          <Stat label="Total views" value={data.views} />
          <Stat label="Enquiries received" value={data.enquiries.received} />
          <Stat label="Enquiries accepted" value={data.enquiries.accepted} />
          <Stat label="Upcoming visits" value={data.visits.upcoming} />
          <Stat label="Completed visits" value={data.visits.completed} />
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-muted-foreground text-sm">{label}</div>
      </CardContent>
    </Card>
  );
}
