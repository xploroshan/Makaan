import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Home as HomeIcon,
  MessageSquareLock,
  Search,
  ShieldCheck,
  Sparkles,
  Trees,
} from "lucide-react";

import { HeroSearch } from "@/components/home/hero-search";
import { ListingCard } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { searchListings } from "@/lib/services/search";
import { searchQuerySchema } from "@/lib/validation/search";
import type { ListingSummary } from "@/lib/types/listing";

const CATEGORIES = [
  { href: "/search?transaction_type=rent", label: "For rent", icon: HomeIcon },
  { href: "/search?transaction_type=sale", label: "For sale", icon: Building2 },
  {
    href: "/search?transaction_type=coliving",
    label: "Co-living / PG",
    icon: MessageSquareLock,
  },
  { href: "/search?property_type=land", label: "Plots & land", icon: Trees },
];

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Zero brokerage",
    body: "Connect directly with owners. No middlemen, no commission, ever.",
  },
  {
    icon: ShieldCheck,
    title: "Zero spam",
    body: "Your number is shared only on mutual consent — never sold or leaked.",
  },
  {
    icon: Sparkles,
    title: "Verified & trusted",
    body: "Verified owners and listings, with ratings only from real visits.",
  },
];

async function getFeatured(): Promise<ListingSummary[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const parsed = searchQuerySchema.parse({ limit: "8", sort: "newest" });
    const { items } = await searchListings(supabase, parsed);
    return items;
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await getFeatured();

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="bg-hero relative overflow-hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-20 pb-20 text-center sm:pt-28">
          <span className="bg-background/70 shadow-soft mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur">
            <Sparkles className="text-gold size-4" />
            Broker-free • India-first • AI-powered search
          </span>
          <h1 className="max-w-4xl text-4xl leading-[1.05] font-extrabold text-balance sm:text-6xl">
            Find a home you&apos;ll love,{" "}
            <span className="text-gradient">without the brokers.</span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-lg text-pretty">
            Rent, co-live, lease, buy or sell — flats, houses and land. Verified
            listings, direct owner chat, and complete transparency.
          </p>
          <div className="mt-10 flex w-full justify-center">
            <HeroSearch />
          </div>

          {/* Category quick links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {CATEGORIES.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="bg-card shadow-soft hover:border-primary hover:text-primary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
              >
                <c.icon className="size-4" />
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Fresh on Dwello
              </h2>
              <p className="text-muted-foreground mt-1">
                The latest verified homes added by owners.
              </p>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/search">View all</Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {/* Pillars */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="bg-card shadow-soft hover:shadow-lift rounded-2xl border p-7 transition-shadow"
            >
              <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-xl">
                <p.icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="bg-brand-gradient text-primary-foreground shadow-lift relative overflow-hidden rounded-3xl px-8 py-14 text-center sm:px-16">
          <div className="absolute -top-10 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="bg-gold/20 absolute -bottom-12 -left-8 size-56 rounded-full blur-2xl" />
          <h2 className="relative text-3xl font-extrabold sm:text-4xl">
            Own a property? List it free in minutes.
          </h2>
          <p className="text-primary-foreground/85 relative mx-auto mt-3 max-w-xl">
            Reach genuine, verified seekers directly. No brokerage, no spam —
            just real leads.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-full px-7"
            >
              <Link href="/owner/listings/new">List your property</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-primary-foreground hover:text-primary-foreground rounded-full border-white/40 bg-transparent px-7 hover:bg-white/10"
            >
              <Link href="/search">
                <Search className="size-4" /> Browse homes
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
