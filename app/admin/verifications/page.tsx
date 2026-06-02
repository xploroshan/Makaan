"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { useAdminList } from "@/lib/hooks/use-admin-list";

interface AdminVerification {
  id: string;
  user_id: string;
  listing_id: string | null;
  type: string;
  status: string;
  evidence_ref: string | null;
}

export default function AdminVerificationsPage() {
  const { data, error, reload } = useAdminList<AdminVerification>(
    "/api/v1/admin/verifications?status=pending",
  );

  async function review(id: string, decision: "verified" | "rejected") {
    await apiFetch(`/api/v1/admin/verifications/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
    reload();
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Verification queue</h1>
      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
      <div className="mt-6 space-y-3">
        {data?.map((v) => (
          <div
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
          >
            <div>
              <Badge variant="secondary">{v.type}</Badge>
              <div className="text-muted-foreground mt-1 text-sm">
                user {v.user_id.slice(0, 8)} · {v.evidence_ref ?? "no evidence"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => review(v.id, "verified")}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => review(v.id, "rejected")}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="text-muted-foreground text-sm">Queue is empty.</p>
        )}
      </div>
    </section>
  );
}
