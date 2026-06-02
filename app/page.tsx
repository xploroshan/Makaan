import Link from "next/link";

import { Button } from "@/components/ui/button";

const PILLARS = [
  {
    title: "Zero brokerage",
    body: "Owners and seekers connect directly. No middlemen, no commission.",
  },
  {
    title: "Zero spam",
    body: "Contact details unlock only on mutual consent — never sold, never leaked.",
  },
  {
    title: "Verified & trusted",
    body: "Verified owners, listings and seekers, with visit-gated ratings you can trust.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="bg-accent text-accent-foreground mb-4 rounded-full px-3 py-1 text-sm font-medium">
          Rent · Co-Live · Lease · Buy &amp; Sell
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          The broker-free way to find a home.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
          Dwello connects home owners and seekers directly — verified listings,
          zero brokerage, and complete transparency. India-first, global-ready.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/search">Find a home</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/owner/listings/new">List your property</Link>
          </Button>
        </div>
      </section>

      <section className="bg-secondary/40 border-t">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold">{p.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
