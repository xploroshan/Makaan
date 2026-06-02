"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { ChatSummary } from "@/lib/services/chat";

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ChatSummary[]>("/api/v1/chats")
      .then(setChats)
      .catch((e: unknown) =>
        setError(
          e instanceof ApiClientError && e.code === "unauthenticated"
            ? "Please sign in to view your chats."
            : "Could not load chats.",
        ),
      );
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold">Your chats</h1>
      {error && (
        <p className="border-warning/40 bg-warning/10 mt-6 rounded-md border p-4 text-sm">
          {error}
        </p>
      )}
      <div className="mt-6 space-y-3">
        {chats?.length === 0 && (
          <p className="text-muted-foreground">
            No chats yet. Express interest in a listing to start one.
          </p>
        )}
        {chats?.map((c) => (
          <Link key={c.id} href={`/chats/${c.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="font-medium">
                  {c.listing_title ?? "Property chat"}
                </div>
                <div className="text-muted-foreground text-sm">
                  Tap to open conversation
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
