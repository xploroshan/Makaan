"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch, ApiClientError } from "@/lib/api/client";

function describe(e: unknown): string {
  if (e instanceof ApiClientError) {
    if (e.code === "forbidden") return "Admin access required.";
    if (e.code === "unauthenticated") return "Please sign in as an admin.";
    return e.message;
  }
  return "Failed to load.";
}

/** Loads an admin list endpoint and exposes a manual reload. */
export function useAdminList<T>(path: string) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    apiFetch<T[]>(path)
      .then((d) => setData(d))
      .catch((e: unknown) => setError(describe(e)));
  }, [path]);

  useEffect(() => {
    let active = true;
    apiFetch<T[]>(path)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e: unknown) => {
        if (active) setError(describe(e));
      });
    return () => {
      active = false;
    };
  }, [path]);

  return { data, error, reload, setError };
}
