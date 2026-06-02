import { ShieldCheck } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Super Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const isAdmin = user?.roles.includes("admin");

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-2xl">
          <ShieldCheck className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Super Admin</h1>
        <p className="text-muted-foreground mt-2">
          {user
            ? "Your account doesn’t have admin access."
            : "Please sign in with an admin account to continue."}
        </p>
        {!user && (
          <Button asChild className="mt-6 rounded-full px-6">
            <a href="/login">Sign in</a>
          </Button>
        )}
      </main>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="bg-brand-gradient text-primary-foreground shadow-soft flex size-9 items-center justify-center rounded-xl">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-xl leading-none font-extrabold">
            Super Admin
          </h1>
          <p className="text-muted-foreground text-xs">
            Platform control & moderation
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="bg-card shadow-soft rounded-2xl border p-2 lg:sticky lg:top-20">
            <AdminNav />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
