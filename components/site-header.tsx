import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";

/** Top navigation with auth-aware actions. */
export async function SiteHeader() {
  const user = await getSessionUser();
  const isAdmin = user?.roles.includes("admin");

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-primary text-lg font-bold">
          Dwello
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Button asChild variant="ghost" size="sm">
            <Link href="/search">Search</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/owner/listings/new">List property</Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/account/activity">Activity</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/chats">Chats</Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <LogoutButton />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
