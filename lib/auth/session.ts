import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { ApiError } from "@/lib/api/errors";

export type AppRole = "seeker" | "owner" | "agent" | "admin";

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  roles: AppRole[];
}

function toSessionUser(user: User): SessionUser {
  const roles = (user.app_metadata?.roles as AppRole[] | undefined) ?? [
    "seeker",
  ];
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    roles,
  };
}

/** Returns the authenticated user or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? toSessionUser(user) : null;
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
