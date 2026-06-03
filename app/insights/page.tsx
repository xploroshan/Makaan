"use client";

import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { formatPrice, formatPriceShort, transactionLabel } from "@/lib/format";
import type { AreaInsights } from "@/lib/services/insights";

export default function InsightsPage() {
  const [city, setCity] = useState("");
  const [tx, setTx] = useState("");
  const [data, setData] = useState<AreaInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (city) qs.set("city", city);
      if (tx) qs.set("transaction_type", tx);
      setData(
        await apiFetch<AreaInsights>(
          `/api/v1/insights${qs.toString() ? `?${qs}` : ""}`,
        ),
      );
    } catch (e) {
      setError(
        e instanceof ApiClientError ? e.message : "Could not load insights.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = data?.stats;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <TrendingUp className="text-primary size-7" /> Price trends &amp;
          insights
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Transparent market stats from Dwello&apos;s live, verified inventory —
          {data?.city ? ` ${data.city}` : " all cities"}.
        </p>
      </div>

      <div className="bg-card shadow-soft mt-6 grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <Label>City</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Bengaluru"
          />
        </div>
        <div>
          <Label>Transaction</Label>
          <Select value={tx} onChange={(e) => setTx(e.target.value)}>
            <option value="">All</option>
            <option value="rent">Rent</option>
            <option value="lease">Lease</option>
            <option value="coliving">Co-living</option>
            <option value="sale">Sale</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={load} className="w-full sm:w-auto">
            Apply
          </Button>
        </div>
      </div>

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-6 rounded-xl border p-4 text-sm">
          {error}
        </p>
      )}

      {s && s.count === 0 && !loading && (
        <p className="text-muted-foreground mt-10 text-center text-sm">
          No active listings match — try a different city or transaction type.
        </p>
      )}

      {s && s.count > 0 && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Listings analysed" value={String(s.count)} />
            <Stat
              label="Average price"
              value={s.avgPrice != null ? formatPrice(s.avgPrice) : "—"}
            />
            <Stat
              label="Median price"
              value={s.medianPrice != null ? formatPrice(s.medianPrice) : "—"}
            />
            <Stat
              label="Avg / sq ft"
              value={
                s.avgPricePerSqft != null
                  ? formatPrice(s.avgPricePerSqft)
                  : "—"
              }
            />
          </div>

          {data!.trend.length > 1 && (
            <Card className="mt-6">
              <CardContent className="p-5">
                <h2 className="font-semibold">Average price by month</h2>
                <Bars
                  data={data!.trend.map((t) => ({
                    label: t.month.slice(5),
                    value: t.avg,
                    caption: formatPriceShort(t.avg),
                  }))}
                />
              </CardContent>
            </Card>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {s.bhkDistribution.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h2 className="font-semibold">Configurations available</h2>
                  <Bars
                    data={s.bhkDistribution.map((b) => ({
                      label: `${b.bhk} BHK`,
                      value: b.count,
                      caption: String(b.count),
                    }))}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold">By transaction type</h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {s.byTransaction.map((t) => (
                    <li
                      key={t.transaction_type}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <span>{transactionLabel(t.transaction_type)}</span>
                      <span className="text-muted-foreground">
                        {t.count} listing{t.count === 1 ? "" : "s"}
                        {t.avgPrice != null && ` · avg ${formatPrice(t.avgPrice)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {data!.topLocalities.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-5">
                <h2 className="font-semibold">Top localities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data!.topLocalities.map((l) => (
                    <Link
                      key={l.locality}
                      href={`/search?city=${encodeURIComponent(
                        data!.city ?? "",
                      )}&q=${encodeURIComponent(l.locality)}`}
                      className="bg-secondary hover:bg-accent rounded-full px-3 py-1 text-sm"
                    >
                      {l.locality} · {l.count}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-muted-foreground text-sm">{label}</div>
      </CardContent>
    </Card>
  );
}

function Bars({
  data,
}: {
  data: { label: string; value: number; caption: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mt-4 flex items-end gap-2" style={{ height: 160 }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-muted-foreground text-[10px]">{d.caption}</span>
          <div
            className="bg-primary/80 hover:bg-primary w-full rounded-t-md transition-colors"
            style={{ height: `${Math.max(4, (d.value / max) * 120)}px` }}
          />
          <span className="text-muted-foreground text-[10px]">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
