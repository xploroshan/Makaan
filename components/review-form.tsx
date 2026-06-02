"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch, ApiClientError } from "@/lib/api/client";

/** Inline form to review another user (seeker ↔ owner). */
export function ReviewForm({
  subjectId,
  subjectLabel,
}: {
  subjectId: string;
  subjectLabel: string;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setState("busy");
    setError(null);
    try {
      await apiFetch(`/api/v1/users/${subjectId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, text: text || undefined }),
      });
      setState("done");
    } catch (e) {
      setState("idle");
      setError(e instanceof ApiClientError ? e.message : "Could not submit");
    }
  }

  if (state === "done") {
    return (
      <p className="text-primary text-sm font-medium">
        Thanks — your review of {subjectLabel} was saved.
      </p>
    );
  }

  return (
    <div className="bg-secondary/40 rounded-lg p-3">
      <div className="text-sm font-medium">Review {subjectLabel}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Select
          value={String(rating)}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-auto"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ★
            </option>
          ))}
        </Select>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Optional — how was the experience?"
          className="flex-1"
        />
        <Button size="sm" onClick={submit} disabled={state === "busy"}>
          {state === "busy" ? "Saving…" : "Submit"}
        </Button>
      </div>
      {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
    </div>
  );
}
