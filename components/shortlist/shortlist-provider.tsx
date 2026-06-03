"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiFetch, ApiClientError } from "@/lib/api/client";

interface ShortlistContextValue {
  signedIn: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
}

const ShortlistContext = createContext<ShortlistContextValue | null>(null);

/**
 * Loads the signed-in user's saved listing IDs once, then exposes optimistic
 * toggle + lookup to every ♥ button. Unauthenticated visitors are routed to
 * sign in when they try to save.
 */
export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<string[]>("/api/v1/me/shortlist/ids")
      .then((list) => {
        if (!active) return;
        setIds(new Set(list));
        setSignedIn(true);
      })
      .catch(() => {
        // Signed out or backend unavailable — leave empty, not signed in.
      });
    return () => {
      active = false;
    };
  }, []);

  const has = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback(
    async (id: string) => {
      if (!signedIn) {
        router.push("/login");
        return;
      }
      const had = ids.has(id);
      setIds((prev) => {
        const next = new Set(prev);
        if (had) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        if (had) {
          await apiFetch(`/api/v1/me/shortlist/${id}`, { method: "DELETE" });
        } else {
          await apiFetch("/api/v1/me/shortlist", {
            method: "POST",
            body: JSON.stringify({ listing_id: id }),
          });
        }
      } catch (e) {
        // Revert on failure.
        setIds((prev) => {
          const next = new Set(prev);
          if (had) next.add(id);
          else next.delete(id);
          return next;
        });
        if (e instanceof ApiClientError && e.code === "unauthenticated") {
          router.push("/login");
        }
      }
    },
    [ids, signedIn, router],
  );

  return (
    <ShortlistContext.Provider value={{ signedIn, has, toggle }}>
      {children}
    </ShortlistContext.Provider>
  );
}

export function useShortlist(): ShortlistContextValue {
  const ctx = useContext(ShortlistContext);
  if (!ctx) {
    throw new Error("useShortlist must be used within a ShortlistProvider");
  }
  return ctx;
}
