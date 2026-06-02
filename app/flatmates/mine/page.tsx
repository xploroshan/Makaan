"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { budgetText } from "@/components/flatmates/flatmate-browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { FlatmatePost } from "@/lib/services/flatmates";

export default function MyFlatmatePostsPage() {
  const [posts, setPosts] = useState<FlatmatePost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setPosts(await apiFetch<FlatmatePost[]>("/api/v1/me/flatmate-posts"));
    } catch (e) {
      setError(
        e instanceof ApiClientError && e.code === "unauthenticated"
          ? "Please sign in to manage your posts."
          : "Could not load your posts.",
      );
    }
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  async function setStatus(id: string, status: "active" | "closed") {
    await apiFetch(`/api/v1/flatmates/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My flatmate posts</h1>
        <Button asChild className="rounded-full px-5">
          <Link href="/flatmates/new">New post</Link>
        </Button>
      </div>

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-6 rounded-md border p-4 text-sm">
          {error}
        </p>
      )}

      {posts && posts.length === 0 && (
        <p className="text-muted-foreground mt-6 text-sm">
          You haven&apos;t posted yet.{" "}
          <Link href="/flatmates/new" className="text-primary underline">
            Post a flatmate ad
          </Link>
          .
        </p>
      )}

      <div className="mt-6 space-y-3">
        {posts?.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <Link
                  href={`/flatmates/${p.id}`}
                  className="font-medium hover:underline"
                >
                  {p.headline}
                </Link>
                <div className="text-muted-foreground mt-1 text-sm">
                  {[p.locality, p.city].filter(Boolean).join(", ")} ·{" "}
                  {budgetText(p)} ·{" "}
                  <span
                    className={
                      p.status === "active"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {p.status}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setStatus(p.id, p.status === "active" ? "closed" : "active")
                }
              >
                {p.status === "active" ? "Close" : "Reopen"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
