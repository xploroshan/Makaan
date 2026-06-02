"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type {
  FormTemplate,
  ListingRow,
  MediaRow,
  TemplateField,
} from "@/lib/types/listing";
import type { PropertyType, TransactionType } from "@/lib/validation/common";

type Step = "category" | "details" | "media" | "review";
type Values = Record<string, string | boolean>;

const TRANSACTIONS: TransactionType[] = ["rent", "lease", "coliving", "sale"];
const PROPERTIES: PropertyType[] = ["flat", "house", "land"];

export function ListingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("category");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transaction, setTransaction] = useState<TransactionType>("rent");
  const [property, setProperty] = useState<PropertyType>("flat");

  const [listing, setListing] = useState<ListingRow | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState<Values>({});
  const [location, setLocation] = useState({
    city: "",
    locality: "",
    pincode: "",
    address: "",
  });
  const [mediaUrl, setMediaUrl] = useState("");
  const [media, setMedia] = useState<MediaRow[]>([]);

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(
        e instanceof ApiClientError ? e.message : "Something went wrong",
      );
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function startDraft() {
    const result = await run(async () => {
      const draft = await apiFetch<ListingRow>("/api/v1/listings", {
        method: "POST",
        body: JSON.stringify({
          transaction_type: transaction,
          property_type: property,
        }),
      });
      const tpl = await apiFetch<FormTemplate>(
        `/api/v1/form-templates?transaction_type=${transaction}&property_type=${property}`,
      );
      return { draft, tpl };
    });
    if (result) {
      setListing(result.draft);
      setTemplate(result.tpl);
      setStep("details");
    }
  }

  async function saveDetails() {
    if (!listing) return;
    const attributes = buildAttributes(template?.fields ?? [], values);
    const ok = await run(() =>
      apiFetch(`/api/v1/listings/${listing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title || undefined,
          description: description || undefined,
          attributes,
          location: cleanLocation(location),
        }),
      }),
    );
    if (ok !== undefined) setStep("media");
  }

  async function addMedia() {
    if (!listing || !mediaUrl) return;
    const row = await run(() =>
      apiFetch<MediaRow>(`/api/v1/listings/${listing.id}/media`, {
        method: "POST",
        body: JSON.stringify({
          type: "photo",
          url: mediaUrl,
          sort_order: media.length,
        }),
      }),
    );
    if (row) {
      setMedia((m) => [...m, row]);
      setMediaUrl("");
    }
  }

  async function publish() {
    if (!listing) return;
    const ok = await run(() =>
      apiFetch(`/api/v1/listings/${listing.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: "active" }),
      }),
    );
    if (ok !== undefined) router.push(`/listings/${listing.id}`);
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />
      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
          {error}
        </p>
      )}

      {step === "category" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="tx">What are you listing?</Label>
            <Select
              id="tx"
              value={transaction}
              onChange={(e) =>
                setTransaction(e.target.value as TransactionType)
              }
            >
              {TRANSACTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="prop">Property type</Label>
            <Select
              id="prop"
              value={property}
              onChange={(e) => setProperty(e.target.value as PropertyType)}
            >
              {PROPERTIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={startDraft} disabled={busy}>
            {busy ? "Starting…" : "Continue"}
          </Button>
        </div>
      )}

      {step === "details" && template && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Spacious 2BHK near the metro"
            />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {template.fields.map((field) => (
              <DynamicField
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(v) =>
                  setValues((prev) => ({ ...prev, [field.key]: v }))
                }
              />
            ))}
          </div>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-semibold">Location</legend>
            <LocField
              label="City"
              value={location.city}
              onChange={(v) => setLocation((l) => ({ ...l, city: v }))}
            />
            <LocField
              label="Locality"
              value={location.locality}
              onChange={(v) => setLocation((l) => ({ ...l, locality: v }))}
            />
            <LocField
              label="Pincode"
              value={location.pincode}
              onChange={(v) => setLocation((l) => ({ ...l, pincode: v }))}
            />
            <LocField
              label="Address (hidden until contact unlocks)"
              value={location.address}
              onChange={(v) => setLocation((l) => ({ ...l, address: v }))}
            />
          </fieldset>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("category")}>
              Back
            </Button>
            <Button onClick={saveDetails} disabled={busy}>
              {busy ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </div>
      )}

      {step === "media" && (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Add photo URLs for now. Direct upload to storage arrives with the
            media pipeline.
          </p>
          <div className="flex gap-2">
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://…/photo.jpg"
            />
            <Button variant="outline" onClick={addMedia} disabled={busy}>
              Add
            </Button>
          </div>
          <ul className="text-muted-foreground text-sm">
            {media.map((m) => (
              <li key={m.id} className="truncate">
                {m.url}
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("details")}>
              Back
            </Button>
            <Button onClick={() => setStep("review")}>Continue</Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <p>
            Ready to publish your {transaction} {property}. Publishing validates
            that all required fields are present.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("media")}>
              Back
            </Button>
            <Button onClick={publish} disabled={busy}>
              {busy ? "Publishing…" : "Publish listing"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: Step[] = ["category", "details", "media", "review"];
  return (
    <ol className="flex flex-wrap gap-2 text-sm">
      {steps.map((s, i) => (
        <li
          key={s}
          className={
            s === step
              ? "bg-primary text-primary-foreground rounded-full px-3 py-1 font-medium"
              : "bg-secondary text-secondary-foreground rounded-full px-3 py-1"
          }
        >
          {i + 1}. {s}
        </li>
      ))}
    </ol>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 self-end text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    );
  }
  return (
    <div>
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      {field.type === "enum" ? (
        <Select
          id={field.key}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          id={field.key}
          type={
            field.type === "currency" || field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : "text"
          }
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.type === "multiselect" ? "comma,separated" : ""}
        />
      )}
    </div>
  );
}

function LocField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Convert raw form values into a typed attributes object for the API. */
function buildAttributes(
  fields: TemplateField[],
  values: Values,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = values[field.key];
    if (raw === undefined || raw === "") continue;
    switch (field.type) {
      case "currency":
      case "number":
        out[field.key] = Number(raw);
        break;
      case "boolean":
        out[field.key] = Boolean(raw);
        break;
      case "multiselect":
        out[field.key] = String(raw)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      default:
        out[field.key] = raw;
    }
  }
  return out;
}

function cleanLocation(loc: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(loc)) if (v) out[k] = v;
  return Object.keys(out).length ? out : undefined;
}
