"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ListingSummary } from "@/lib/types/listing";

const KEY = "dwello.compare";
export const COMPARE_MAX = 4;

interface CompareContextValue {
  items: ListingSummary[];
  count: number;
  full: boolean;
  has: (id: string) => boolean;
  toggle: (listing: ListingSummary) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

/** Client-only compare tray (up to {@link COMPARE_MAX}), persisted to localStorage. */
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ListingSummary[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) setItems(JSON.parse(raw) as ListingSummary[]);
      } catch {
        // ignore
      }
    })();
  }, []);

  const write = useCallback((next: ListingSummary[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [
    items,
  ]);

  const toggle = useCallback(
    (listing: ListingSummary) => {
      const exists = items.some((i) => i.id === listing.id);
      if (exists) {
        write(items.filter((i) => i.id !== listing.id));
      } else if (items.length < COMPARE_MAX) {
        write([...items, listing]);
      }
    },
    [items, write],
  );

  const remove = useCallback(
    (id: string) => write(items.filter((i) => i.id !== id)),
    [items, write],
  );

  const clear = useCallback(() => write([]), [write]);

  return (
    <CompareContext.Provider
      value={{
        items,
        count: items.length,
        full: items.length >= COMPARE_MAX,
        has,
        toggle,
        remove,
        clear,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return ctx;
}
