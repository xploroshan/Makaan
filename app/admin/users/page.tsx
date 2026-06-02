"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { useAdminList } from "@/lib/hooks/use-admin-list";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  roles: string[];
  status: string;
}

export default function AdminUsersPage() {
  const { data, error, reload } = useAdminList<AdminUser>(
    "/api/v1/admin/users",
  );

  async function setStatus(id: string, status: string) {
    await apiFetch(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    reload();
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Users</h1>
      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
      <div className="mt-6 space-y-3">
        {data?.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
          >
            <div>
              <div className="font-medium">{u.name ?? "Unnamed"}</div>
              <div className="text-muted-foreground text-sm">
                {u.email ?? u.phone ?? u.id.slice(0, 8)}
              </div>
              <div className="mt-1 flex gap-1">
                {u.roles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))}
                <Badge variant={u.status === "active" ? "success" : "outline"}>
                  {u.status}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {u.status !== "suspended" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus(u.id, "suspended")}
                >
                  Suspend
                </Button>
              )}
              {u.status !== "banned" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setStatus(u.id, "banned")}
                >
                  Ban
                </Button>
              )}
              {u.status !== "active" && (
                <Button size="sm" onClick={() => setStatus(u.id, "active")}>
                  Reactivate
                </Button>
              )}
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="text-muted-foreground text-sm">No users.</p>
        )}
      </div>
    </section>
  );
}
