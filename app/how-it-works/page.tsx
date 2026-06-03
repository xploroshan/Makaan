import {
  BadgeCheck,
  CalendarCheck,
  Camera,
  Handshake,
  KeyRound,
  MessageSquareLock,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "How it works",
  description:
    "How Dwello works for seekers and owners — broker-free, consent-based, zero spam.",
};

const SEEKER_STEPS = [
  {
    icon: Search,
    title: "Search smart",
    body: "Filter by budget, locality or pincode, or just type what you want — our AI search understands plain English.",
  },
  {
    icon: MessageSquareLock,
    title: "Express interest",
    body: "Found one you like? Send an interest. The owner's contact stays private until they accept — so your number does too.",
  },
  {
    icon: CalendarCheck,
    title: "Chat & visit",
    body: "Once accepted, chat in-app and schedule a physical or video visit at a time that suits you both.",
  },
  {
    icon: KeyRound,
    title: "Move in",
    body: "Close the deal directly with the owner. No brokerage, no middlemen — and rate the place after your visit.",
  },
];

const OWNER_STEPS = [
  {
    icon: Camera,
    title: "List in minutes",
    body: "A guided, category-aware wizard (rent, co-living, sale, land) gets your listing live in under three minutes.",
  },
  {
    icon: UserCheck,
    title: "Get genuine leads",
    body: "Verified seekers express interest. You see their profile and reviews before sharing any contact details.",
  },
  {
    icon: Handshake,
    title: "Choose who to talk to",
    body: "Accept the right enquiries to reveal contact and open a chat. Decline the rest — zero spam for everyone.",
  },
  {
    icon: Wallet,
    title: "Close commission-free",
    body: "Track views, leads and visits from your dashboard. Co-living operators manage rooms and occupancy too.",
  },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Zero spam",
    body: "Contact is shared only on mutual consent. We never sell or leak your number.",
  },
  {
    icon: Star,
    title: "Real reviews only",
    body: "Property ratings are gated to people who actually completed a visit — no fakes.",
  },
  {
    icon: BadgeCheck,
    title: "Verified & broker-free",
    body: "Verified owners and listings, connecting you directly. No brokerage, ever.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="flex-1">
      <section className="bg-hero">
        <div className="mx-auto w-full max-w-4xl px-6 py-16 text-center">
          <span className="bg-background/70 shadow-soft mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur">
            <Sparkles className="text-gold size-4" /> How Dwello works
          </span>
          <h1 className="text-4xl font-extrabold text-balance sm:text-5xl">
            Finding or filling a home,{" "}
            <span className="text-gradient">the honest way.</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
            No brokers. No spam. No fake reviews. Just verified homes and direct,
            consent-based connections between seekers and owners.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <Track
          eyebrow="For seekers"
          title="Find a place you'll love"
          steps={SEEKER_STEPS}
          cta={{ href: "/search", label: "Start searching" }}
        />
        <div className="mt-20">
          <Track
            eyebrow="For owners & agents"
            title="Fill it, commission-free"
            steps={OWNER_STEPS}
            cta={{ href: "/owner/listings/new", label: "List your property" }}
          />
        </div>
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="bg-card shadow-soft rounded-2xl border p-7"
            >
              <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-xl">
                <p.icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-7">
            <Link href="/search">Browse homes</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-7">
            <Link href="/faq">Read the FAQ</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function Track({
  eyebrow,
  title,
  steps,
  cta,
}: {
  eyebrow: string;
  title: string;
  steps: { icon: typeof Search; title: string; body: string }[];
  cta: { href: string; label: string };
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-primary text-sm font-semibold tracking-wide uppercase">
            {eyebrow}
          </div>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h2>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      </div>
      <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="bg-card shadow-soft relative rounded-2xl border p-6"
          >
            <span className="bg-brand-gradient text-primary-foreground absolute -top-3 left-6 flex size-7 items-center justify-center rounded-full text-sm font-bold">
              {i + 1}
            </span>
            <s.icon className="text-primary mt-2 size-6" />
            <h3 className="mt-3 font-semibold">{s.title}</h3>
            <p className="text-muted-foreground mt-1.5 text-sm">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
