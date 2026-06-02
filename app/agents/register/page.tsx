"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { AgentProfile } from "@/lib/types/profile";

export default function RegisterAgentPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    kind: "agent",
    business_name: "",
    about: "",
    brokerage_terms: "",
    areas_served: "",
    years_active: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const agent = await apiFetch<AgentProfile>("/api/v1/agents", {
        method: "POST",
        body: JSON.stringify({
          kind: form.kind,
          business_name: form.business_name,
          about: form.about || undefined,
          brokerage_terms: form.brokerage_terms || undefined,
          years_active: form.years_active
            ? Number(form.years_active)
            : undefined,
          areas_served: form.areas_served
            ? form.areas_served
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        }),
      });
      router.push(`/agents/${agent.id}`);
    } catch (e) {
      setError(
        e instanceof ApiClientError ? e.message : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold">Register as an agent or company</h1>
      <p className="text-muted-foreground mt-1">
        Build a branded profile with your listings, brokerage details and
        ratings. Seekers always see who is a professional.
      </p>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive mt-6 rounded-md border p-3 text-sm">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="kind">Account type</Label>
          <Select
            id="kind"
            value={form.kind}
            onChange={(e) => set("kind", e.target.value)}
          >
            <option value="agent">Individual agent / broker</option>
            <option value="company">Real-estate company</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="business_name">Business name *</Label>
          <Input
            id="business_name"
            value={form.business_name}
            onChange={(e) => set("business_name", e.target.value)}
            placeholder="Acme Realty"
          />
        </div>
        <div>
          <Label htmlFor="about">About</Label>
          <Textarea
            id="about"
            value={form.about}
            onChange={(e) => set("about", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="brokerage_terms">Brokerage terms</Label>
          <Input
            id="brokerage_terms"
            value={form.brokerage_terms}
            onChange={(e) => set("brokerage_terms", e.target.value)}
            placeholder="e.g. 1 month rent on closure"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="areas_served">Areas served (comma-separated)</Label>
            <Input
              id="areas_served"
              value={form.areas_served}
              onChange={(e) => set("areas_served", e.target.value)}
              placeholder="Koramangala, Indiranagar"
            />
          </div>
          <div>
            <Label htmlFor="years_active">Years active</Label>
            <Input
              id="years_active"
              type="number"
              value={form.years_active}
              onChange={(e) => set("years_active", e.target.value)}
            />
          </div>
        </div>
        <Button onClick={submit} disabled={busy || !form.business_name}>
          {busy ? "Creating…" : "Create profile"}
        </Button>
      </div>
    </main>
  );
}
