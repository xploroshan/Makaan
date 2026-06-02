"use client";

import { BellPlus, Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";

/** Saves the current search filters as an alert. */
export function SaveSearchButton({
  filters,
}: {
  filters: Record<string, string>;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">(
    "idle",
  );
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setState("busy");
    setMsg(null);
    try {
      await apiFetch("/api/v1/me/saved-searches", {
        method: "POST",
        body: JSON.stringify({ filters }),
      });
      setState("done");
    } catch (e) {
      setState("error");
      setMsg(
        e instanceof ApiClientError && e.code === "unauthenticated"
          ? "Sign in to save searches"
          : "Could not save",
      );
    }
  }

  if (state === "done") {
    return (
      <span className="text-primary inline-flex items-center gap-1.5 text-sm font-medium">
        <Check className="size-4" /> Alert saved
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="rounded-full"
        onClick={save}
        disabled={state === "busy"}
      >
        <BellPlus className="size-4" />
        {state === "busy" ? "Saving…" : "Save this search"}
      </Button>
      {msg && <span className="text-destructive text-sm">{msg}</span>}
    </div>
  );
}
