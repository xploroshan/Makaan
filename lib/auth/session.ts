import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { ApiError } from "@/lib/api/errors";

export type AppRole = "seeker" | "owner" | "agent" | "admin";

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  roles: AppRole[];
}

/**
 * Returns the authenticated user or null. Never throws.
 * Roles are read from `public.users.roles` (the source of truth used by RLS
 * and the admin bootstrap), NOT from the JWT's app_metadata.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("roles")
      .eq("id", user.id)
      .maybeSingle();

    const roles = (profile?.roles as AppRole[] | undefined) ?? ["seeker"];
    return {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      roles,
    };
  } catch {
    // Supabase not configured / unreachable — treat as signed out.
    return null;
  }
}

/** Returns the authenticated user or throws 401. Use to gate protected routes. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw ApiError.unauthenticated();
  return user;
}

/** Returns the authenticated user with a required role, or throws 401/403. */
export async function requireRole(role: AppRole): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.roles.includes(role) && !user.roles.includes("admin")) {
    throw ApiError.forbidden(`Requires the "${role}" role`);
  }
  return user;
}
