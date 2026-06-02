import { createSupabaseAdminClient } from "@/lib/db/supabase-admin";

/**
 * Server-driven configuration & feature flags (PRD §5.10 "no-deploy control").
 * Values live in the `app_config` table and are edited via the Super Admin
 * console, so behaviour can change live without a deployment.
 *
 * A short in-process cache keeps the hot path cheap; TTL is intentionally low
 * so admin changes propagate quickly.
 */
const CACHE_TTL_MS = 30_000;

type ConfigRow = { key: string; value: unknown; enabled: boolean };

let cache: { at: number; rows: Map<string, ConfigRow> } | null = null;

async function load(): Promise<Map<string, ConfigRow>> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.rows;
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_config")
    .select("key, value, enabled");

  const rows = new Map<string, ConfigRow>();
  if (!error && data) {
    for (const row of data as ConfigRow[]) rows.set(row.key, row);
  }
  cache = { at: Date.now(), rows };
  return rows;
}

/** Whether a feature flag is enabled. Defaults to `fallback` if unset. */
export async function isFeatureEnabled(
  key: string,
  fallback = false,
): Promise<boolean> {
  const rows = await load();
  const row = rows.get(key);
  return row ? row.enabled : fallback;
}

/** Read a typed config value, falling back to a default if unset/disabled. */
export async function getConfig<T>(key: string, fallback: T): Promise<T> {
  const rows = await load();
  const row = rows.get(key);
  if (!row || !row.enabled) return fallback;
  return (row.value as T) ?? fallback;
}

/** Test/admin helper to drop the in-process cache. */
export function clearConfigCache() {
  cache = null;
}
