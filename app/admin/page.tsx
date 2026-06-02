"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { PlatformStats } from "@/lib/services/admin";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<PlatformStats>("/api/v1/admin/stats")
      .then((s) => active && setStats(s))
      .catch((e: unknown) =>
        setError(e instanceof ApiClientError ? e.message : "Failed to load."),
      );
    return () => {
      active = false;
    };
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-bold">Overview</h1>
      {error && (
        <p className="border-warning/40 bg-warning/10 mt-4 rounded-md border p-3 text-sm">
          {error}
        </p>
      )}
      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Users" value={stats.users} />
          <Stat label="Active listings" value={stats.listings.active} />
          <Stat label="Total listings" value={stats.listings.total} />
          <Stat label="Enquiries" value={stats.enquiries} />
          <Stat
            label="Pending verifications"
            value={stats.pendingVerifications}
          />
          <Stat label="Open reports" value={stats.openReports} />
        </div>
      )}
    </section>
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
