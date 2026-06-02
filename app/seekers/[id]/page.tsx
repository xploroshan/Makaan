import { notFound } from "next/navigation";

import { TrustBadges } from "@/components/profile/trust-badges";
import { ReviewForm } from "@/components/review-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { ApiError } from "@/lib/api/errors";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import {
  getPublicSeekerProfile,
  type PublicSeekerProfile,
} from "@/lib/services/profiles";
import {
  listUserReviews,
  type UserReviewSummary,
} from "@/lib/services/reviews";

type Params = { id: string };

export default async function SeekerPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  let profile: PublicSeekerProfile;
  let reviews: UserReviewSummary = { items: [], average: 0, count: 0 };
  let canReview = false;
  try {
    const supabase = await createSupabaseServerClient();
    const viewer = await getSessionUser();
    profile = await getPublicSeekerProfile(supabase, id);
    reviews = await listUserReviews(supabase, id);
    if (viewer && viewer.id !== id) {
      const { data } = await supabase.rpc("users_have_interacted", {
        a: viewer.id,
        b: id,
      });
      canReview = Boolean(data);
    }
  } catch (err) {
    if (err instanceof ApiError && err.code === "not_found") notFound();
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <p className="border-warning/40 bg-warning/10 rounded-xl border p-4 text-sm">
          This profile can’t be loaded. Configure Supabase to view live data.
        </p>
      </main>
    );
  }

  const lifestyle = profile.lifestyle;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-8">
      <div className="flex items-center gap-4">
        <div className="bg-brand-gradient text-primary-foreground shadow-soft flex size-16 items-center justify-center rounded-full text-2xl font-bold">
          {(profile.name ?? "S").charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.name ?? "Seeker"}</h1>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
            {profile.city && <span>{profile.city}</span>}
            {profile.is_student && <Badge variant="secondary">Student</Badge>}
            {reviews.count > 0 && (
              <Stars value={reviews.average} count={reviews.count} />
            )}
          </div>
        </div>
      </div>

      <TrustBadges trust={profile.trust} />

      {profile.bio && (
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {(profile.occupation || profile.languages.length > 0) && (
        <Card>
          <CardContent className="space-y-2 p-5 text-sm">
            {profile.occupation && (
              <div>
                <span className="font-medium">Occupation: </span>
                {profile.occupation}
              </div>
            )}
            {profile.languages.length > 0 && (
              <div>
                <span className="font-medium">Languages: </span>
                {profile.languages.join(", ")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {lifestyle && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-3 p-5 text-sm sm:grid-cols-3">
            <Fact label="Schedule" value={lifestyle.schedule} />
            <Fact label="Food" value={lifestyle.food} />
            <Fact label="Cleanliness" value={lifestyle.cleanliness} />
            <Fact label="Smoking" value={boolText(lifestyle.smoking)} />
            <Fact label="Pets" value={boolText(lifestyle.pets)} />
            <Fact label="Guests" value={lifestyle.guests} />
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <section>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Reviews ({reviews.count})</h2>
          {reviews.count > 0 && <Stars value={reviews.average} />}
        </div>
        {canReview && (
          <div className="mt-3">
            <ReviewForm
              subjectId={id}
              subjectLabel={profile.name ?? "this person"}
            />
          </div>
        )}
        <div className="mt-4 space-y-3">
          {reviews.count === 0 && (
            <p className="text-muted-foreground text-sm">No reviews yet.</p>
          )}
          {reviews.items.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {r.reviewer_name ?? "A member"}
                  </span>
                  <Stars value={r.rating} />
                </div>
                {r.text && (
                  <p className="text-muted-foreground mt-2 text-sm">{r.text}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function boolText(v: boolean | null): string | null {
  if (v == null) return null;
  return v ? "Yes" : "No";
}
