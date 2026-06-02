"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { OccupancyBar } from "@/components/coliving/occupancy-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { ColivingRoom, ColivingRoomsResult } from "@/lib/services/coliving";

const ROOM_TYPES = ["single", "double", "triple", "dormitory"] as const;

interface RoomDraft {
  name: string;
  room_type: string;
  total_beds: number;
  occupied_beds: number;
  rent: string;
}

const emptyDraft: RoomDraft = {
  name: "",
  room_type: "single",
  total_beds: 1,
  occupied_beds: 0,
  rent: "",
};

function draftBody(d: RoomDraft) {
  return {
    name: d.name,
    room_type: d.room_type,
    total_beds: d.total_beds,
    occupied_beds: d.occupied_beds,
    rent: d.rent === "" ? undefined : Number(d.rent),
  };
}

export default function ManageRoomsPage() {
  const params = useParams<{ id: string }>();
  const listingId = params.id;

  const [data, setData] = useState<ColivingRoomsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ColivingRoomsResult>(`/api/v1/owner/listings/${listingId}/rooms`)
      .then(setData)
      .catch((e: unknown) =>
        setError(
          e instanceof ApiClientError
            ? e.message
            : "Could not load this property.",
        ),
      );
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <Link
        href="/owner/coliving"
        className="text-primary text-sm underline"
      >
        ← All properties
      </Link>

      {error && (
        <p className="border-warning/40 bg-warning/10 mt-4 rounded-md border p-4 text-sm">
          {error}
        </p>
      )}

      {data && (
        <>
          <h1 className="mt-4 text-2xl font-bold">
            {data.listing.title ?? "Co-living property"}
          </h1>
          <div className="text-muted-foreground mt-1 text-sm">
            {data.summary.occupied_beds}/{data.summary.total_beds} beds occupied
            · {data.summary.vacant_beds} vacant
          </div>
          {data.summary.total_beds > 0 && (
            <div className="mt-4">
              <OccupancyBar rate={data.summary.occupancy_rate} />
            </div>
          )}

          <section className="mt-8 space-y-3">
            {data.rooms.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No rooms yet. Add your first room below.
              </p>
            )}
            {data.rooms.map((room) => (
              <RoomRow key={room.id} room={room} onChange={load} />
            ))}
          </section>

          <AddRoom listingId={listingId} onAdded={load} />
        </>
      )}
    </main>
  );
}

function RoomRow({
  room,
  onChange,
}: {
  room: ColivingRoom;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoomDraft>({
    name: room.name,
    room_type: room.room_type,
    total_beds: room.total_beds,
    occupied_beds: room.occupied_beds,
    rent: room.rent != null ? String(room.rent) : "",
  });

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch(`/api/v1/owner/rooms/${room.id}`, {
        method: "PUT",
        body: JSON.stringify(draftBody(draft)),
      });
      setEditing(false);
      onChange();
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch(`/api/v1/owner/rooms/${room.id}`, { method: "DELETE" });
      onChange();
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : "Could not delete");
      setBusy(false);
    }
  }

  if (!editing) {
    const vacant = room.total_beds - room.occupied_beds;
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <div className="font-medium">{room.name}</div>
            <div className="text-muted-foreground mt-0.5 text-sm capitalize">
              {room.room_type} · {room.occupied_beds}/{room.total_beds} beds
              {vacant > 0 && (
                <span className="text-primary"> · {vacant} vacant</span>
              )}
              {room.rent != null && (
                <span> · ₹{room.rent.toLocaleString("en-IN")}/bed</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-primary text-sm underline"
            >
              Edit
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="text-destructive text-sm underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
          {err && <p className="text-destructive w-full text-sm">{err}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <RoomFields draft={draft} setDraft={setDraft} />
        {err && <p className="text-destructive mt-2 text-sm">{err}</p>}
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(false)}
            disabled={busy}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddRoom({
  listingId,
  onAdded,
}: {
  listingId: string;
  onAdded: () => void;
}) {
  const [draft, setDraft] = useState<RoomDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch(`/api/v1/owner/listings/${listingId}/rooms`, {
        method: "POST",
        body: JSON.stringify(draftBody(draft)),
      });
      setDraft(emptyDraft);
      onAdded();
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : "Could not add room");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Add a room</h2>
      <Card className="mt-3">
        <CardContent className="p-4">
          <RoomFields draft={draft} setDraft={setDraft} />
          {err && <p className="text-destructive mt-2 text-sm">{err}</p>}
          <Button className="mt-3" onClick={add} disabled={busy}>
            {busy ? "Adding…" : "Add room"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function RoomFields({
  draft,
  setDraft,
}: {
  draft: RoomDraft;
  setDraft: (d: RoomDraft) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Room name</Label>
        <Input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="e.g. Room 101"
        />
      </div>
      <div>
        <Label>Type</Label>
        <Select
          value={draft.room_type}
          onChange={(e) => setDraft({ ...draft, room_type: e.target.value })}
        >
          {ROOM_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Total beds</Label>
        <Input
          type="number"
          min={1}
          value={draft.total_beds}
          onChange={(e) =>
            setDraft({ ...draft, total_beds: Number(e.target.value) })
          }
        />
      </div>
      <div>
        <Label>Occupied beds</Label>
        <Input
          type="number"
          min={0}
          value={draft.occupied_beds}
          onChange={(e) =>
            setDraft({ ...draft, occupied_beds: Number(e.target.value) })
          }
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Rent per bed (₹/month, optional)</Label>
        <Input
          type="number"
          min={0}
          value={draft.rent}
          onChange={(e) => setDraft({ ...draft, rent: e.target.value })}
          placeholder="e.g. 8000"
        />
      </div>
    </div>
  );
}
