"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { OccupancyBar } from "@/components/coliving/occupancy-bar";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { ColivingOverview } from "@/lib/services/coliving";

export default function ColivingOverviewPage() {
  const [data, setData] = useState<ColivingOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ColivingOverview>("/api/v1/owner/coliving")
      .then(setData)
      .catch((e: unknown) =>
        setError(
          e instanceof ApiClientError && e.code === "unauthenticated"
            ? "Please sign in to manage occupancy."
            : "Could not load occupancy.",
        ),
      );
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Co-living occupancy</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track beds across your co-living &amp; PG properties.
          </p>
        </div>
        <Link href="/owner/dashboard" className="text-primary text-sm underline">
          ← Dashboard
        </Link>
      </div>

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-6 rounded-md border p-4 text-sm">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Properties" value={data.totals.properties} />
            <Stat label="Total beds" value={data.totals.total_beds} />
            <Stat label="Occupied" value={data.totals.occupied_beds} />
            <Stat label="Vacant" value={data.totals.vacant_beds} />
          </div>

          {data.totals.total_beds > 0 && (
            <div className="mt-4">
              <OccupancyBar rate={data.totals.occupancy_rate} />
            </div>
          )}

          <h2 className="mt-10 text-lg font-semibold">Properties</h2>
          {data.properties.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              You have no co-living listings yet.{" "}
              <Link
                href="/owner/listings/new"
                className="text-primary underline"
              >
                List one
              </Link>{" "}
              to start tracking occupancy.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.properties.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {p.title ?? "Untitled co-living"}
                      </div>
                      <div className="text-muted-foreground mt-1 text-sm">
                        {p.summary.occupied_beds}/{p.summary.total_beds} beds
                        occupied · {p.summary.rooms} room
                        {p.summary.rooms === 1 ? "" : "s"} ·{" "}
                        {p.summary.vacant_beds} vacant
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-primary text-lg font-semibold tabular-nums">
                        {Math.round(p.summary.occupancy_rate * 100)}%
                      </span>
                      <Link
                        href={`/owner/coliving/${p.id}`}
                        className="text-primary text-sm underline"
                      >
                        Manage rooms
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-3xl font-bold tabular-nums">{value}</div>
        <div className="text-muted-foreground text-sm">{label}</div>
      </CardContent>
    </Card>
  );
}
