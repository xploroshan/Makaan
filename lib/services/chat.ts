import { ApiError } from "@/lib/api/errors";
import type { DbClient } from "@/lib/db/client";
import type { Chat, Message } from "@/lib/types/connect";

const SCAM_PATTERNS = [
  /western union/i,
  /wire transfer/i,
  /gift ?card/i,
  /send (me )?(the )?otp/i,
  /pay .*(deposit|token|advance).*(before|to confirm|without).*(visit|seeing)/i,
  /bitcoin|crypto wallet/i,
];

const PROFANITY = [/\bf[u*]ck/i, /\bsh[i*]t\b/i, /\bb[i*]tch\b/i];

export interface MessageScreen {
  allowed: boolean;
  reason?: string;
}

/**
 * Lightweight, pure spam/scam/profanity screen for chat messages.
 * Unit-tested. Heavier ML moderation is a P2 enhancement.
 */
export function screenMessage(body: string): MessageScreen {
  if (SCAM_PATTERNS.some((p) => p.test(body))) {
    return {
      allowed: false,
      reason: "This message looks like a scam and was blocked.",
    };
  }
  if (PROFANITY.some((p) => p.test(body))) {
    return {
      allowed: false,
      reason: "Please keep the conversation respectful.",
    };
  }
  return { allowed: true };
}

const BURST_WINDOW_MS = 60_000;
const BURST_LIMIT = 20;

export async function sendMessage(
  supabase: DbClient,
  chatId: string,
  senderId: string,
  body: string,
): Promise<Message> {
  const screen = screenMessage(body);
  if (!screen.allowed) throw ApiError.validation(screen.reason!);

  // Simple per-sender burst limit within the chat.
  const since = new Date(Date.now() - BURST_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("chat_id", chatId)
    .eq("sender_id", senderId)
    .gte("created_at", since);
  if ((count ?? 0) >= BURST_LIMIT) {
    throw new ApiError(
      "rate_limited",
      "You're sending messages too quickly. Please slow down.",
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ chat_id: chatId, sender_id: senderId, body })
    .select("id, chat_id, sender_id, body, read_at, created_at")
    .single();
  // RLS only lets chat participants insert; a violation surfaces as an error.
  if (error) throw error;
  return data as unknown as Message;
}

export async function listMessages(
  supabase: DbClient,
  chatId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, chat_id, sender_id, body, read_at, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as Message[];
}

/**
 * Find or create a listing-less direct chat between two users (used by the
 * flatmate finder for peer-to-peer messaging). Idempotent per pair.
 */
export async function startDirectChat(
  supabase: DbClient,
  meId: string,
  otherId: string,
): Promise<{ id: string }> {
  if (meId === otherId) {
    throw ApiError.validation("You can't message yourself.");
  }
  const { data: existing, error: findErr } = await supabase
    .from("chats")
    .select("id")
    .is("listing_id", null)
    .or(
      `and(owner_id.eq.${meId},seeker_id.eq.${otherId}),` +
        `and(owner_id.eq.${otherId},seeker_id.eq.${meId})`,
    )
    .limit(1);
  if (findErr) throw findErr;
  const found = (existing ?? [])[0] as { id: string } | undefined;
  if (found) return { id: found.id };

  const { data, error } = await supabase
    .from("chats")
    .insert({ owner_id: meId, seeker_id: otherId, listing_id: null })
    .select("id")
    .single();
  if (error) throw error;
  return data as unknown as { id: string };
}

export interface ChatSummary extends Chat {
  listing_title: string | null;
}

export async function listChats(
  supabase: DbClient,
  userId: string,
): Promise<ChatSummary[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("id, listing_id, owner_id, seeker_id, created_at, listings(title)")
    .or(`owner_id.eq.${userId},seeker_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    (data ?? []) as unknown as (Chat & {
      listings: { title: string | null } | { title: string | null }[] | null;
    })[]
  ).map((c) => {
    const l = Array.isArray(c.listings) ? c.listings[0] : c.listings;
    return {
      id: c.id,
      listing_id: c.listing_id,
      owner_id: c.owner_id,
      seeker_id: c.seeker_id,
      created_at: c.created_at,
      listing_title: l?.title ?? null,
    };
  });
}
