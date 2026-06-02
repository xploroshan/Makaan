/**
 * Centralised, validated access to Supabase environment variables.
 *
 * IMPORTANT: the public vars must be referenced by their *literal* names
 * (`process.env.NEXT_PUBLIC_SUPABASE_URL`), not via a computed key like
 * `process.env[name]`. Next.js only inlines `NEXT_PUBLIC_*` values into the
 * browser bundle for literal, statically-analysable references — a dynamic
 * lookup resolves to `undefined` client-side.
 */
function requireValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in your host's environment variables (and .env.local for local dev).`,
    );
  }
  return value;
}

export const supabaseEnv = {
  url: () =>
    requireValue(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
  anonKey: () =>
    requireValue(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  /** Server-only. Never exposed to the browser. */
  serviceRoleKey: () =>
    requireValue(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
};
