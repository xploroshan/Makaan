"use client";

import {
  Building2,
  CheckCircle2,
  Flag,
  Home,
  MessageSquare,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { PlatformStats } from "@/lib/services/admin";
import { cn } from "@/lib/utils";

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

  const cards = stats
    ? [
        { label: "Users", value: stats.users, icon: Users, tone: "teal" },
        {
          label: "Active listings",
          value: stats.listings.active,
          icon: Home,
          tone: "teal",
        },
        {
          label: "Total listings",
          value: stats.listings.total,
          icon: Building2,
          tone: "slate",
        },
        {
          label: "Enquiries",
          value: stats.enquiries,
          icon: MessageSquare,
          tone: "slate",
        },
        {
          label: "Pending verifications",
          value: stats.pendingVerifications,
          icon: CheckCircle2,
          tone: "gold",
        },
        {
          label: "Open reports",
          value: stats.openReports,
          icon: Flag,
          tone: "rose",
        },
      ]
    : [];

  return (
    <section>
      <h2 className="text-2xl font-bold">Overview</h2>
      <p className="text-muted-foreground mt-1">
        A live snapshot of the platform.
      </p>

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-4 rounded-md border p-3 text-sm">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-card shadow-soft hover:shadow-lift rounded-2xl border p-5 transition-shadow"
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                c.tone === "teal" && "bg-accent text-accent-foreground",
                c.tone === "slate" && "bg-secondary text-secondary-foreground",
                c.tone === "gold" && "bg-gold/15 text-gold",
                c.tone === "rose" && "bg-destructive/10 text-destructive",
              )}
            >
              <c.icon className="size-5" />
            </span>
            <div className="mt-4 text-3xl font-bold tabular-nums">
              {c.value}
            </div>
            <div className="text-muted-foreground text-sm">{c.label}</div>
          </div>
        ))}
        {!stats && !error && (
          <div className="text-muted-foreground text-sm">Loading…</div>
        )}
      </div>
    </section>
  );
}
