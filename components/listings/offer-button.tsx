"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api/client";

/** Apply / make an offer with terms — the step that opens a real deal. */
export function OfferButton({
  listingId,
  transactionType,
  defaultPrice,
}: {
  listingId: string;
  transactionType: string;
  defaultPrice: number | null;
}) {
  const router = useRouter();
  const isSale = transactionType === "sale";
  const cta = isSale ? "Make an offer" : "Apply to rent";

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    offer_price: defaultPrice ? String(defaultPrice) : "",
    deposit: "",
    move_in: "",
    duration_months: "",
    message: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/listings/${listingId}/offers`, {
        method: "POST",
        body: JSON.stringify({
          offer_price: Number(form.offer_price),
          deposit: form.deposit ? Number(form.deposit) : undefined,
          move_in: form.move_in || undefined,
          duration_months: form.duration_months
            ? Number(form.duration_months)
            : undefined,
          message: form.message || undefined,
        }),
      });
      setDone(true);
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiClientError && e.code === "unauthenticated") {
        router.push("/login");
      } else {
        setError(e instanceof ApiClientError ? e.message : "Could not submit.");
      }
    }
  }

  if (done) {
    return (
      <p className="border-primary/30 bg-primary/5 mt-3 rounded-lg border p-3 text-center text-sm font-medium">
        Application sent — track it under{" "}
        <a href="/account/activity" className="text-primary underline">
          your activity
        </a>
        .
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        className="mt-3 w-full"
        onClick={() => setOpen(true)}
      >
        {cta}
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border p-4">
      <div className="text-sm font-semibold">{cta}</div>
      <div>
        <Label>{isSale ? "Your offer (₹)" : "Proposed rent (₹/mo)"}</Label>
        <Input
          type="number"
          value={form.offer_price}
          onChange={(e) => set("offer_price", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{isSale ? "Booking amount" : "Deposit"} (₹)</Label>
          <Input
            type="number"
            value={form.deposit}
            onChange={(e) => set("deposit", e.target.value)}
          />
        </div>
        <div>
          <Label>{isSale ? "Possession by" : "Move-in"}</Label>
          <Input
            type="date"
            value={form.move_in}
            onChange={(e) => set("move_in", e.target.value)}
          />
        </div>
        {!isSale && (
          <div>
            <Label>Duration (months)</Label>
            <Input
              type="number"
              value={form.duration_months}
              onChange={(e) => set("duration_months", e.target.value)}
            />
          </div>
        )}
      </div>
      <div>
        <Label>Message (optional)</Label>
        <Textarea
          rows={2}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="A note to the owner…"
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={submit} disabled={busy || !form.offer_price}>
          {busy ? "Sending…" : "Send application"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
