import Link from "next/link";
import { Home } from "lucide-react";

import { AccountMenu } from "@/components/account-menu";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";

/** Sticky, glassy, auth-aware top navigation. */
export async function SiteHeader() {
  const user = await getSessionUser();
  const isAdmin = user?.roles.includes("admin") ?? false;

  return (
    <header className="glass border-border/60 sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-brand-gradient text-primary-foreground shadow-soft flex size-8 items-center justify-center rounded-lg">
            <Home className="size-4" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Dwello
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/search">Search</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/owner/listings/new">List property</Link>
          </Button>
          {user ? (
            <>
              <NotificationBell />
              <AccountMenu email={user.email} isAdmin={isAdmin} />
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full px-5">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
