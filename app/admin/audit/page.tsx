"use client";

import { useAdminList } from "@/lib/hooks/use-admin-list";

interface AuditEntry {
  id: number;
  actor: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  at: string;
}

export default function AdminAuditPage() {
  const { data, error } = useAdminList<AuditEntry>("/api/v1/admin/audit");

  return (
    <section>
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Every admin action is recorded immutably.
      </p>
      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
      <div className="mt-6 divide-y rounded-lg border">
        {data?.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
          >
            <div>
              <span className="font-medium">{a.action}</span>
              <span className="text-muted-foreground ml-2">
                {a.entity}
                {a.entity_id ? ` #${a.entity_id.slice(0, 8)}` : ""}
              </span>
            </div>
            <div className="text-muted-foreground text-xs">
              {a.actor?.slice(0, 8) ?? "system"} ·{" "}
              {new Date(a.at).toLocaleString()}
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="text-muted-foreground p-3 text-sm">No actions yet.</p>
        )}
      </div>
    </section>
  );
}
