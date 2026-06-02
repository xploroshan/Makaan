"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useAdminList } from "@/lib/hooks/use-admin-list";

interface AdminTemplate {
  id: string;
  transaction_type: string;
  property_type: string;
  version: number;
  fields: unknown[];
  enabled: boolean;
}

const SAMPLE = JSON.stringify(
  {
    transaction_type: "rent",
    property_type: "flat",
    version: 2,
    enabled: true,
    fields: [
      { key: "price", label: "Monthly rent", type: "currency", required: true },
    ],
    validations: { required: ["price"] },
  },
  null,
  2,
);

export default function AdminFormsPage() {
  const { data, error, reload } = useAdminList<AdminTemplate>(
    "/api/v1/admin/forms",
  );
  const [json, setJson] = useState(SAMPLE);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return setMsg("Invalid JSON");
    }
    try {
      await apiFetch("/api/v1/admin/forms", {
        method: "PUT",
        body: JSON.stringify(parsed),
      });
      setMsg("Template saved.");
      reload();
    } catch (e) {
      setMsg(e instanceof ApiClientError ? e.message : "Save failed");
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Form templates</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Edit the category-specific listing forms live — no deploy required.
      </p>
      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}

      <div className="mt-6 space-y-2">
        {data?.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border p-3 text-sm"
          >
            <span>
              {t.transaction_type} · {t.property_type} · v{t.version} ·{" "}
              {t.fields.length} fields
            </span>
            <Badge variant={t.enabled ? "success" : "outline"}>
              {t.enabled ? "enabled" : "disabled"}
            </Badge>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Create / update a template</h2>
      <Textarea
        className="mt-2 h-72 font-mono text-xs"
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={save}>Save template</Button>
        {msg && <span className="text-muted-foreground text-sm">{msg}</span>}
      </div>
    </section>
  );
}
