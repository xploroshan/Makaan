"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";
import { useAdminList } from "@/lib/hooks/use-admin-list";

interface AdminGeo {
  id: string;
  city: string;
  locality: string | null;
  pincode: string | null;
  enabled: boolean;
}

export default function AdminGeoPage() {
  const { data, error, reload } = useAdminList<AdminGeo>("/api/v1/admin/geo");
  const [form, setForm] = useState({ city: "", locality: "", pincode: "" });

  async function add() {
    await apiFetch("/api/v1/admin/geo", {
      method: "POST",
      body: JSON.stringify({
        city: form.city,
        locality: form.locality || undefined,
        pincode: form.pincode || undefined,
      }),
    });
    setForm({ city: "", locality: "", pincode: "" });
    reload();
  }

  async function toggle(id: string, enabled: boolean) {
    await apiFetch(`/api/v1/admin/geo/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
    reload();
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Geography</h1>
      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}

      <div className="mt-6 flex flex-wrap items-end gap-2">
        <Input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="w-40"
        />
        <Input
          placeholder="Locality"
          value={form.locality}
          onChange={(e) => setForm({ ...form, locality: e.target.value })}
          className="w-40"
        />
        <Input
          placeholder="Pincode"
          value={form.pincode}
          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
          className="w-32"
        />
        <Button onClick={add} disabled={!form.city}>
          Add
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {data?.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between rounded-lg border p-3 text-sm"
          >
            <span>
              {g.city}
              {g.locality && ` · ${g.locality}`}
              {g.pincode && ` · ${g.pincode}`}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={g.enabled ? "success" : "outline"}>
                {g.enabled ? "enabled" : "disabled"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggle(g.id, !g.enabled)}
              >
                {g.enabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
