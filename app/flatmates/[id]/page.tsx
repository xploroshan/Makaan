"use client";

import { CalendarDays, MapPin, MessageCircle, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  CompatibilityBadge,
  CompatibilityBreakdown,
} from "@/components/flatmates/compatibility-badge";
import { budgetText } from "@/components/flatmates/flatmate-browser";
import { LifestyleChips } from "@/components/flatmates/lifestyle-chips";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { scoreCompatibility, type LifestyleTraits } from "@/lib/compatibility";
import type { FlatmatePost } from "@/lib/services/flatmates";

const KIND_LABEL: Record<string, string> = {
  has_place: "Has a place",
  needs_place: "Looking to share",
};

export default function FlatmatePostPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<FlatmatePost | null>(null);
  const [viewer, setViewer] = useState<{
    id: string;
    lifestyle: LifestyleTraits | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const p = await apiFetch<FlatmatePost>(`/api/v1/flatmates/${id}`);
        setPost(p);
      } catch (e) {
        setError(
          e instanceof ApiClientError ? e.message : "Could not load this post.",
        );
      }
      try {
        const me = await apiFetch<{
          user: { id: string };
          lifestyle: LifestyleTraits | null;
        }>("/api/v1/me/profile");
        setViewer({ id: me.user.id, lifestyle: me.lifestyle });
      } catch {
        // signed out
      }
    })();
  }, [id]);

  async function connect() {
    if (!post) return;
    setConnecting(true);
    try {
      const { id: chatId } = await apiFetch<{ id: string }>(
        "/api/v1/chats/direct",
        {
          method: "POST",
          body: JSON.stringify({ user_id: post.author_id }),
        },
      );
      router.push(`/chats/${chatId}`);
    } catch (e) {
      setConnecting(false);
      if (e instanceof ApiClientError && e.code === "unauthenticated") {
        router.push("/login");
      } else {
        setError(e instanceof ApiClientError ? e.message : "Could not connect.");
      }
    }
  }

  async function close() {
    if (!post) return;
    await apiFetch(`/api/v1/flatmates/${post.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed" }),
    });
    setPost({ ...post, status: "closed" });
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <p className="border-warning/40 bg-warning/10 rounded-xl border p-4 text-sm">
          {error}
        </p>
      </main>
    );
  }
  if (!post) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </main>
    );
  }

  const isAuthor = viewer?.id === post.author_id;
  const compat =
    viewer?.lifestyle && post.author.lifestyle
      ? scoreCompatibility(viewer.lifestyle, post.author.lifestyle)
      : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <Link href="/flatmates" className="text-muted-foreground text-sm">
        ← All flatmates
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="bg-accent text-accent-foreground inline-block rounded-full px-3 py-1 text-xs font-medium">
            {KIND_LABEL[post.kind]}
          </span>
          <h1 className="mt-2 text-2xl font-bold">{post.headline}</h1>
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {[post.locality, post.city].filter(Boolean).join(", ")}
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="size-4" /> {budgetText(post)}
            </span>
            {post.move_in && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> From {post.move_in}
              </span>
            )}
          </div>
        </div>
        {compat && compat.rated > 0 && <CompatibilityBadge result={compat} />}
      </div>

      {post.status === "closed" && (
        <p className="bg-secondary mt-4 rounded-lg px-4 py-2 text-sm">
          This post has been closed.
        </p>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          {post.description && (
            <section>
              <h2 className="font-semibold">About</h2>
              <p className="text-muted-foreground mt-2 whitespace-pre-line">
                {post.description}
              </p>
            </section>
          )}

          <section className="mt-6">
            <h2 className="font-semibold">Lifestyle</h2>
            {post.author.lifestyle ? (
              <LifestyleChips
                lifestyle={post.author.lifestyle}
                className="mt-3"
              />
            ) : (
              <p className="text-muted-foreground mt-2 text-sm">
                This member hasn&apos;t shared lifestyle details.
              </p>
            )}
          </section>

          {compat && compat.rated > 0 && (
            <section className="mt-6">
              <h2 className="font-semibold">Why you might click</h2>
              <div className="mt-3">
                <CompatibilityBreakdown result={compat} />
              </div>
            </section>
          )}
        </div>

        <aside>
          <div className="bg-card shadow-soft rounded-2xl border p-5">
            <div className="flex items-center gap-2">
              <span className="bg-brand-gradient text-primary-foreground flex size-10 items-center justify-center rounded-full font-bold">
                {(post.author.name ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {post.author.name ?? "A member"}
                </div>
                <Link
                  href={`/seekers/${post.author_id}`}
                  className="text-primary text-xs underline"
                >
                  View profile
                </Link>
              </div>
            </div>

            {isAuthor ? (
              post.status === "active" && (
                <Button
                  variant="outline"
                  onClick={close}
                  className="mt-4 w-full"
                >
                  Close this post
                </Button>
              )
            ) : (
              <Button
                onClick={connect}
                disabled={connecting}
                className="mt-4 w-full"
              >
                <MessageCircle className="size-4" />
                {connecting ? "Connecting…" : "Message"}
              </Button>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
