/**
 * Centralised, validated access to Supabase environment variables.
 * Throws early with a clear message if configuration is missing.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const supabaseEnv = {
  url: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  anonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  /** Server-only. Never expose to the browser. */
  serviceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
};
