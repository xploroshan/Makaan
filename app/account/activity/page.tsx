"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ReviewForm } from "@/components/review-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { EnquiryWithListing } from "@/lib/types/connect";
import type { VisitWithListing } from "@/lib/services/visits";

export default function ActivityPage() {
  const [me, setMe] = useState<string | null>(null);
  const [sent, setSent] = useState<EnquiryWithListing[]>([]);
  const [received, setReceived] = useState<EnquiryWithListing[]>([]);
  const [visits, setVisits] = useState<VisitWithListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      const [profile, enquiries, myVisits] = await Promise.all([
        apiFetch<{ id: string }>("/api/v1/me"),
        apiFetch<{
          sent: EnquiryWithListing[];
          received: EnquiryWithListing[];
        }>("/api/v1/me/enquiries"),
        apiFetch<VisitWithListing[]>("/api/v1/me/visits"),
      ]);
      setMe(profile.id);
      setSent(enquiries.sent);
      setReceived(enquiries.received);
      setVisits(myVisits);
    } catch (e) {
      setError(
        e instanceof ApiClientError && e.code === "unauthenticated"
          ? "Please sign in to view your activity."
          : "Could not load your activity.",
      );
    }
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  async function act(fn: () => Promise<unknown>, ok: string) {
    setMsg(null);
    try {
      await fn();
      setMsg(ok);
      await load();
    } catch (e) {
      setMsg(e instanceof ApiClientError ? e.message : "Action failed");
    }
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="border-warning/40 bg-warning/10 rounded-md border p-4 text-sm">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-8">
      <h1 className="text-2xl font-bold">Your activity</h1>
      {msg && (
        <p className="bg-accent/40 rounded-md border p-3 text-sm">{msg}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Enquiries received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {received.length === 0 && (
            <p className="text-muted-foreground text-sm">No enquiries yet.</p>
          )}
          {received.map((e) => (
            <div key={e.id} className="space-y-2 border-b pb-3 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {e.listing_title ?? "Listing"}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Status: {e.status}
                    {e.contact_revealed && " · contact shared"}
                  </div>
                </div>
                {e.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        act(
                          () =>
                            apiFetch(`/api/v1/enquiries/${e.id}/consent`, {
                              method: "POST",
                              body: JSON.stringify({ action: "accept" }),
                            }),
                          "Enquiry accepted — contact shared.",
                        )
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        act(
                          () =>
                            apiFetch(`/api/v1/enquiries/${e.id}/consent`, {
                              method: "POST",
                              body: JSON.stringify({ action: "decline" }),
                            }),
                          "Enquiry declined.",
                        )
                      }
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
              {e.status === "accepted" && (
                <ReviewForm
                  subjectId={e.seeker_id}
                  subjectLabel="this seeker"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interests sent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent.length === 0 && (
            <p className="text-muted-foreground text-sm">
              You haven’t expressed interest yet.
            </p>
          )}
          {sent.map((e) => (
            <SentEnquiry
              key={e.id}
              enquiry={e}
              onSchedule={(slot, mode) =>
                act(
                  () =>
                    apiFetch("/api/v1/visits", {
                      method: "POST",
                      body: JSON.stringify({
                        listing_id: e.listing_id,
                        slot,
                        mode,
                      }),
                    }),
                  "Visit requested.",
                )
              }
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {visits.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No visits scheduled.
            </p>
          )}
          {visits.map((v) => {
            const iAmSeeker = v.seeker_id === me;
            return (
              <div key={v.id} className="space-y-2 border-b pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {v.listing_title ?? "Listing"}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {new Date(v.slot).toLocaleString()} · {v.mode} ·{" "}
                      {v.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!iAmSeeker && v.status === "proposed" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          act(
                            () => updateVisit(v.id, "confirmed"),
                            "Visit confirmed.",
                          )
                        }
                      >
                        Confirm
                      </Button>
                    )}
                    {!iAmSeeker &&
                      (v.status === "confirmed" || v.status === "proposed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            act(
                              () => updateVisit(v.id, "completed"),
                              "Visit marked completed.",
                            )
                          }
                        >
                          Mark completed
                        </Button>
                      )}
                  </div>
                </div>
                {iAmSeeker && v.status === "completed" && (
                  <RatingForm
                    onSubmit={(rating, review) =>
                      act(
                        () =>
                          apiFetch(`/api/v1/listings/${v.listing_id}/ratings`, {
                            method: "POST",
                            body: JSON.stringify({
                              visit_id: v.id,
                              rating,
                              review: review || undefined,
                            }),
                          }),
                        "Thanks for rating this property.",
                      )
                    }
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm">
        <Link href="/chats" className="text-primary underline">
          Go to your chats
        </Link>
      </p>
    </main>
  );

  function updateVisit(id: string, status: string) {
    return apiFetch(`/api/v1/visits/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }
}

function SentEnquiry({
  enquiry,
  onSchedule,
}: {
  enquiry: EnquiryWithListing;
  onSchedule: (slot: string, mode: string) => void;
}) {
  const [slot, setSlot] = useState("");
  const [mode, setMode] = useState("physical");
  return (
    <div className="space-y-2 border-b pb-4 last:border-0">
      <div className="font-medium">{enquiry.listing_title ?? "Listing"}</div>
      <div className="text-muted-foreground text-sm">
        Status: {enquiry.status}
        {enquiry.contact_revealed && " · contact shared"}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          type="datetime-local"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          className="w-auto"
        />
        <Select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-auto"
        >
          <option value="physical">Physical</option>
          <option value="video">Video</option>
        </Select>
        <Button
          size="sm"
          variant="outline"
          disabled={!slot}
          onClick={() => onSchedule(new Date(slot).toISOString(), mode)}
        >
          Request visit
        </Button>
      </div>
      {enquiry.status === "accepted" && enquiry.owner_id && (
        <ReviewForm subjectId={enquiry.owner_id} subjectLabel="the owner" />
      )}
    </div>
  );
}

function RatingForm({
  onSubmit,
}: {
  onSubmit: (rating: number, review: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  return (
    <div className="bg-secondary/40 flex flex-wrap items-end gap-2 rounded-md p-3">
      <Select
        value={String(rating)}
        onChange={(e) => setRating(Number(e.target.value))}
        className="w-auto"
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} ★
          </option>
        ))}
      </Select>
      <Input
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Optional review"
        className="flex-1"
      />
      <Button size="sm" onClick={() => onSubmit(rating, review)}>
        Submit rating
      </Button>
    </div>
  );
}
