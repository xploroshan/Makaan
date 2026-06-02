"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { Enquiry } from "@/lib/types/connect";

/**
 * Express interest in a listing. On success a chat thread opens; contact
 * details are revealed only after the owner accepts (handled elsewhere).
 */
export function InterestButton({ listingId }: { listingId: string }) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "busy" }
    | { kind: "sent"; chatId: string; status: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function express() {
    setState({ kind: "busy" });
    try {
      const res = await apiFetch<{ enquiry: Enquiry; chat_id: string }>(
        "/api/v1/enquiries",
        { method: "POST", body: JSON.stringify({ listing_id: listingId }) },
      );
      setState({
        kind: "sent",
        chatId: res.chat_id,
        status: res.enquiry.status,
      });
    } catch (e) {
      setState({
        kind: "error",
        message:
          e instanceof ApiClientError && e.code === "unauthenticated"
            ? "Please sign in to contact the owner."
            : e instanceof ApiClientError
              ? e.message
              : "Something went wrong",
      });
    }
  }

  if (state.kind === "sent") {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          {state.status === "accepted"
            ? "Owner accepted — contact unlocked."
            : "Interest sent. We've opened a chat with the owner."}
        </p>
        <Button asChild className="w-full">
          <Link href={`/chats/${state.chatId}`}>Open chat</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        onClick={express}
        disabled={state.kind === "busy"}
      >
        {state.kind === "busy" ? "Sending…" : "Express interest"}
      </Button>
      {state.kind === "error" && (
        <p className="text-destructive text-sm">{state.message}</p>
      )}
    </div>
  );
}
