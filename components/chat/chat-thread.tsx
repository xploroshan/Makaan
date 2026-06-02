"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { createSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import type { Message } from "@/lib/types/connect";
import { cn } from "@/lib/utils";

/** Real-time 1:1 chat thread backed by Supabase Realtime. */
export function ChatThread({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [history, profile] = await Promise.all([
          apiFetch<Message[]>(`/api/v1/chats/${chatId}/messages`),
          apiFetch<{ id: string }>("/api/v1/me"),
        ]);
        if (!active) return;
        setMessages(history);
        setMe(profile.id);
      } catch (e) {
        setError(
          e instanceof ApiClientError && e.code === "unauthenticated"
            ? "Please sign in to view this chat."
            : "Could not load this chat.",
        );
      }
    })();

    // Live updates: append messages inserted into this chat.
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const text = body.trim();
    if (!text) return;
    setError(null);
    setBody("");
    try {
      const msg = await apiFetch<Message>(`/api/v1/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
      });
      // Optimistic insert (realtime may also deliver it; de-duped by id).
      setMessages((prev) =>
        prev.some((x) => x.id === msg.id) ? prev : [...prev, msg],
      );
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not send");
      setBody(text);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center text-sm">
            No messages yet. Say hello 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
        />
        <Button type="submit">Send</Button>
      </form>
      {error && <p className="text-destructive px-3 pb-3 text-sm">{error}</p>}
    </div>
  );
}
