import { AdminNav } from "@/components/admin/admin-nav";
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
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Super Admin</h1>
        <p className="text-muted-foreground mt-2">
          {user
            ? "Your account doesn’t have admin access."
            : "Please sign in with an admin account to continue."}
        </p>
      </main>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
      <aside className="lg:w-52 lg:shrink-0">
        <h2 className="text-muted-foreground mb-3 text-sm font-semibold">
          Super Admin
        </h2>
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
