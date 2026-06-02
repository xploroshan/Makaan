"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TrustBadges } from "@/components/profile/trust-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { MyProfile } from "@/lib/services/profiles";
import { DEFAULT_SEEKER_PRIVACY } from "@/lib/types/profile";

export default function AccountProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Editable state
  const [seeker, setSeeker] = useState({ bio: "", city: "", occupation: "" });
  const [privacy, setPrivacy] = useState(DEFAULT_SEEKER_PRIVACY);
  const [lifestyle, setLifestyle] = useState({
    schedule: "",
    food: "",
    cleanliness: "",
  });
  const [evidence, setEvidence] = useState("");

  useEffect(() => {
    apiFetch<MyProfile>("/api/v1/me/profile")
      .then((p) => {
        setProfile(p);
        setSeeker({
          bio: p.seeker?.bio ?? "",
          city: p.seeker?.city ?? "",
          occupation: p.seeker?.occupation ?? "",
        });
        if (p.seeker?.privacy) setPrivacy(p.seeker.privacy);
        setLifestyle({
          schedule: p.lifestyle?.schedule ?? "",
          food: p.lifestyle?.food ?? "",
          cleanliness: p.lifestyle?.cleanliness ?? "",
        });
      })
      .catch((e: unknown) => {
        setLoadError(
          e instanceof ApiClientError && e.code === "unauthenticated"
            ? "Please sign in to manage your profile."
            : "Could not load your profile. Configure Supabase to use this page.",
        );
      });
  }, []);

  async function save(path: string, body: unknown, label: string) {
    setMsg(null);
    try {
      await apiFetch(path, { method: "PATCH", body: JSON.stringify(body) });
      setMsg(`${label} saved.`);
    } catch (e) {
      setMsg(e instanceof ApiClientError ? e.message : "Save failed");
    }
  }

  async function submitVerification(type: "identity" | "ownership") {
    setMsg(null);
    if (!evidence) return setMsg("Add an evidence reference first.");
    try {
      await apiFetch(`/api/v1/verifications/${type}`, {
        method: "POST",
        body: JSON.stringify({ evidence_ref: evidence }),
      });
      setMsg(`${type} verification submitted for review.`);
      setEvidence("");
    } catch (e) {
      setMsg(e instanceof ApiClientError ? e.message : "Submit failed");
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <p className="border-warning/40 bg-warning/10 rounded-md border p-4 text-sm">
          {loadError}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your profile</h1>
        {profile && <TrustBadges trust={profile.trust} />}
      </div>
      {msg && (
        <p className="bg-accent/40 rounded-md border p-3 text-sm">{msg}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={seeker.city}
              onChange={(e) => setSeeker({ ...seeker, city: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              value={seeker.occupation}
              onChange={(e) =>
                setSeeker({ ...seeker, occupation: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={seeker.bio}
              onChange={(e) => setSeeker({ ...seeker, bio: e.target.value })}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Privacy</legend>
            {(
              [
                ["show_bio", "Show bio publicly"],
                ["show_occupation", "Show occupation publicly"],
                ["show_lifestyle", "Show lifestyle publicly"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={privacy[key]}
                  onChange={(e) =>
                    setPrivacy({ ...privacy, [key]: e.target.checked })
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
          <Button
            onClick={() =>
              save("/api/v1/me/profile", { ...seeker, privacy }, "Profile")
            }
          >
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lifestyle (for co-living matching)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Select
                id="schedule"
                value={lifestyle.schedule}
                onChange={(e) =>
                  setLifestyle({ ...lifestyle, schedule: e.target.value })
                }
              >
                <option value="">—</option>
                <option value="early_bird">Early bird</option>
                <option value="night_owl">Night owl</option>
                <option value="flexible">Flexible</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="food">Food</Label>
              <Select
                id="food"
                value={lifestyle.food}
                onChange={(e) =>
                  setLifestyle({ ...lifestyle, food: e.target.value })
                }
              >
                <option value="">—</option>
                <option value="veg">Veg</option>
                <option value="non_veg">Non-veg</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="vegan">Vegan</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="cleanliness">Cleanliness</Label>
              <Select
                id="cleanliness"
                value={lifestyle.cleanliness}
                onChange={(e) =>
                  setLifestyle({ ...lifestyle, cleanliness: e.target.value })
                }
              >
                <option value="">—</option>
                <option value="relaxed">Relaxed</option>
                <option value="moderate">Moderate</option>
                <option value="very_tidy">Very tidy</option>
              </Select>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              save(
                "/api/v1/me/lifestyle",
                Object.fromEntries(
                  Object.entries(lifestyle).filter(([, v]) => v),
                ),
                "Lifestyle",
              )
            }
          >
            Save lifestyle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Upload your document to private storage, then submit its reference
            for review to earn a trust badge.
          </p>
          <Input
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="verification-docs/<your-id>/aadhaar.pdf"
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => submitVerification("identity")}
            >
              Submit ID
            </Button>
            <Button
              variant="outline"
              onClick={() => submitVerification("ownership")}
            >
              Submit ownership
            </Button>
          </div>
        </CardContent>
      </Card>

      {profile && (
        <p className="text-muted-foreground text-sm">
          Want a branded professional page?{" "}
          <Link href="/agents/register" className="text-primary underline">
            Register as an agent
          </Link>
          .
        </p>
      )}
    </main>
  );
}
