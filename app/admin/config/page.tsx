"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useAdminList } from "@/lib/hooks/use-admin-list";

interface AdminConfig {
  key: string;
  value: unknown;
  scope: string;
  enabled: boolean;
}

export default function AdminConfigPage() {
  const { data, error, reload } = useAdminList<AdminConfig>(
    "/api/v1/admin/config",
  );
  const [form, setForm] = useState({ key: "", value: "", enabled: true });
  const [msg, setMsg] = useState<string | null>(null);

  async function upsert(key: string, rawValue: string, enabled: boolean) {
    setMsg(null);
    let value: unknown = rawValue;
    try {
      value = JSON.parse(rawValue);
    } catch {
      // Treat as a plain string if not valid JSON.
    }
    try {
      await apiFetch("/api/v1/admin/config", {
        method: "PUT",
        body: JSON.stringify({ key, value, enabled }),
      });
      setMsg(`${key} saved.`);
      reload();
    } catch (e) {
      setMsg(e instanceof ApiClientError ? e.message : "Save failed");
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Config &amp; feature flags</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Feature flags, pricing and CMS values applied live across all clients.
      </p>
      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
      {msg && <p className="text-muted-foreground mt-3 text-sm">{msg}</p>}

      <div className="mt-6 flex flex-wrap items-end gap-2">
        <Input
          placeholder="key (e.g. feature.nl_search)"
          value={form.key}
          onChange={(e) => setForm({ ...form, key: e.target.value })}
          className="w-56"
        />
        <Input
          placeholder='value (JSON, e.g. true or "text")'
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          className="w-56"
        />
        <Button
          disabled={!form.key}
          onClick={() => upsert(form.key, form.value, form.enabled)}
        >
          Save
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {data?.map((c) => (
          <div
            key={c.key}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
          >
            <div>
              <span className="font-mono">{c.key}</span>
              <span className="text-muted-foreground ml-2">
                {JSON.stringify(c.value)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={c.enabled ? "success" : "outline"}>
                {c.enabled ? "on" : "off"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  upsert(c.key, JSON.stringify(c.value), !c.enabled)
                }
              >
                {c.enabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
