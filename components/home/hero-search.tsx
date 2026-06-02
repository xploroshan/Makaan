"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "rent", label: "Rent" },
  { key: "sale", label: "Buy" },
  { key: "coliving", label: "Co-living" },
  { key: "lease", label: "Lease" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<string>("rent");
  const [q, setQ] = useState("");

  function go() {
    const params = new URLSearchParams({ transaction_type: tab });
    const text = q.trim();
    if (/^[1-9][0-9]{5}$/.test(text)) params.set("pincode", text);
    else if (text) params.set("city", text);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-background/70 shadow-soft mb-3 flex gap-1 rounded-full p-1 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-brand-gradient text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-card shadow-lift flex items-center gap-2 rounded-2xl border p-2">
        <Search className="text-muted-foreground ml-2 size-5 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="Search by city, locality or pincode…"
          className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-base outline-none"
        />
        <Button onClick={go} size="lg" className="rounded-xl px-6">
          Search
        </Button>
      </div>
    </div>
  );
}
