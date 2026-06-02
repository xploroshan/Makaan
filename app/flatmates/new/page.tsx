"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api/client";

export default function NewFlatmatePostPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    kind: "needs_place",
    headline: "",
    city: "",
    locality: "",
    budget_min: "",
    budget_max: "",
    move_in: "",
    gender_pref: "any",
    occupancy: "shared",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const body = {
        kind: form.kind,
        headline: form.headline,
        city: form.city,
        locality: form.locality || undefined,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        move_in: form.move_in || undefined,
        gender_pref: form.gender_pref,
        occupancy: form.occupancy,
        description: form.description || undefined,
      };
      const { id } = await apiFetch<{ id: string }>("/api/v1/flatmates", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/flatmates/${id}`);
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof ApiClientError
          ? e.code === "unauthenticated"
            ? "Please sign in to post a flatmate ad."
            : e.message
          : "Could not publish your post.",
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <Link href="/flatmates" className="text-muted-foreground text-sm">
        ← Back to flatmates
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Post a flatmate ad</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Tell people what you&apos;re looking for. Your lifestyle profile powers
        compatibility matching.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <Label>I&apos;m…</Label>
          <Select value={form.kind} onChange={(e) => set("kind", e.target.value)}>
            <option value="needs_place">
              Looking for a place &amp; flatmates to share with
            </option>
            <option value="has_place">
              I have a place and need a flatmate
            </option>
          </Select>
        </div>

        <div>
          <Label>Headline</Label>
          <Input
            value={form.headline}
            onChange={(e) => set("headline", e.target.value)}
            placeholder="e.g. Quiet working professional seeking 2BHK share in HSR"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>City</Label>
            <Input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Bengaluru"
            />
          </div>
          <div>
            <Label>Locality (optional)</Label>
            <Input
              value={form.locality}
              onChange={(e) => set("locality", e.target.value)}
              placeholder="HSR Layout"
            />
          </div>
          <div>
            <Label>Budget min (₹/mo)</Label>
            <Input
              type="number"
              value={form.budget_min}
              onChange={(e) => set("budget_min", e.target.value)}
            />
          </div>
          <div>
            <Label>Budget max (₹/mo)</Label>
            <Input
              type="number"
              value={form.budget_max}
              onChange={(e) => set("budget_max", e.target.value)}
            />
          </div>
          <div>
            <Label>Move-in</Label>
            <Input
              type="date"
              value={form.move_in}
              onChange={(e) => set("move_in", e.target.value)}
            />
          </div>
          <div>
            <Label>Preferred flatmate</Label>
            <Select
              value={form.gender_pref}
              onChange={(e) => set("gender_pref", e.target.value)}
            >
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </div>
          <div>
            <Label>Room</Label>
            <Select
              value={form.occupancy}
              onChange={(e) => set("occupancy", e.target.value)}
            >
              <option value="shared">Shared room</option>
              <option value="private">Private room</option>
            </Select>
          </div>
        </div>

        <div>
          <Label>About you &amp; what you want (optional)</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            placeholder="Your habits, work, what you're looking for in a flatmate…"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          onClick={submit}
          disabled={busy || !form.headline || !form.city}
          className="rounded-full px-6"
        >
          {busy ? "Publishing…" : "Publish post"}
        </Button>
      </div>
    </main>
  );
}
