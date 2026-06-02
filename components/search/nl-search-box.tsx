"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api/client";

/** Natural-language search: parses free text into filters, then navigates. */
export function NlSearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const text = q.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      const { filters } = await apiFetch<{ filters: Record<string, string> }>(
        "/api/v1/ai/search-parse",
        { method: "POST", body: JSON.stringify({ q: text }) },
      );
      router.push(`/search?${new URLSearchParams(filters).toString()}`);
    } catch (e) {
      setError(
        e instanceof ApiClientError ? e.message : "Could not parse that",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-accent/30 mb-4 rounded-lg border p-4">
      <label className="text-sm font-medium" htmlFor="nl">
        ✨ Describe what you want
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          id="nl"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="2BHK under 30k near a metro in Pune, pet friendly"
        />
        <Button onClick={submit} disabled={busy}>
          {busy ? "Thinking…" : "Search"}
        </Button>
      </div>
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </div>
  );
}
