import Link from "next/link";
import { Home } from "lucide-react";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { href: "/search?transaction_type=rent", label: "Homes for rent" },
      { href: "/search?transaction_type=sale", label: "Homes for sale" },
      { href: "/search?transaction_type=coliving", label: "Co-living & PG" },
      { href: "/search?property_type=land", label: "Plots & land" },
      { href: "/flatmates", label: "Find a flatmate" },
    ],
  },
  {
    title: "Owners",
    links: [
      { href: "/owner/listings/new", label: "Post a property" },
      { href: "/owner/dashboard", label: "Owner dashboard" },
      { href: "/agents/register", label: "For agents & brokers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/tools", label: "EMI & rent calculators" },
      { href: "/compare", label: "Compare homes" },
      { href: "/faq", label: "Help & FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/search", label: "Browse listings" },
      { href: "/account/saved", label: "Saved homes" },
      { href: "/account/profile", label: "Your account" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-secondary/30 mt-20 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-brand-gradient text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Home className="size-4" />
            </span>
            <span className="font-display text-lg font-extrabold">Dwello</span>
          </div>
          <p className="text-muted-foreground mt-3 max-w-xs text-sm">
            The broker-free property &amp; co-living marketplace. Verified
            listings, zero brokerage, zero spam.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="text-muted-foreground border-t py-6 text-center text-xs">
        © {new Date().getFullYear()} Dwello · Made in India 🇮🇳 · Rent · Co-Live
        · Lease · Buy &amp; Sell
      </div>
    </footer>
  );
}
