"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { useAdminList } from "@/lib/hooks/use-admin-list";

interface AdminReport {
  id: string;
  subject_type: string;
  subject_id: string;
  reason: string;
  detail: string | null;
  status: string;
}

export default function AdminReportsPage() {
  const { data, error, reload } = useAdminList<AdminReport>(
    "/api/v1/admin/reports?status=open",
  );

  async function setStatus(id: string, status: string) {
    await apiFetch(`/api/v1/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    reload();
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Reports</h1>
      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
      <div className="mt-6 space-y-3">
        {data?.map((r) => (
          <div key={r.id} className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{r.subject_type}</Badge>
              <span className="text-sm font-medium">{r.reason}</span>
            </div>
            <div className="text-muted-foreground mt-1 text-sm">
              {r.subject_id}
              {r.detail && ` — ${r.detail}`}
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus(r.id, "reviewing")}
              >
                Reviewing
              </Button>
              <Button size="sm" onClick={() => setStatus(r.id, "actioned")}>
                Actioned
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus(r.id, "dismissed")}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="text-muted-foreground text-sm">No open reports.</p>
        )}
      </div>
    </section>
  );
}
