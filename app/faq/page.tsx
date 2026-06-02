import { ChevronDown } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "FAQ & help",
  description: "Answers to common questions about Dwello.",
};

const SECTIONS: { heading: string; items: { q: string; a: string }[] }[] = [
  {
    heading: "For seekers",
    items: [
      {
        q: "Is Dwello really broker-free?",
        a: "Yes. You connect directly with property owners and agents. There is no brokerage or commission charged by Dwello, ever.",
      },
      {
        q: "Will my phone number be spammed?",
        a: "No. Your contact details are shared only when you express interest and the owner accepts — and theirs only then too. We never sell or leak your number.",
      },
      {
        q: "How do I save homes I like?",
        a: "Tap the ♥ icon on any listing to add it to your private Saved homes. Use the compare icon to line up to four homes side by side.",
      },
      {
        q: "Can I trust the reviews?",
        a: "Property ratings can only be left by seekers who actually completed a visit, so what you read reflects real experiences — not fakes.",
      },
      {
        q: "How does the AI search work?",
        a: "Type a request in plain English like \"2 BHK under 25k near Koramangala\" and Dwello translates it into the right filters for you.",
      },
    ],
  },
  {
    heading: "For owners & agents",
    items: [
      {
        q: "How much does it cost to list?",
        a: "Listing is free. A guided wizard tailored to your category — rent, co-living/PG, sale or land — gets you live in minutes.",
      },
      {
        q: "Who can see my contact details?",
        a: "Nobody, until you accept an interest. You can review a seeker's profile and reviews before deciding to share contact and open a chat.",
      },
      {
        q: "Can I manage a co-living or PG property?",
        a: "Yes. Co-living operators get room-level occupancy tools to track total and occupied beds and rent across every property.",
      },
      {
        q: "How do I get verified?",
        a: "Submit identity and ownership verification from your account. Verified badges build trust and get you more genuine leads.",
      },
    ],
  },
  {
    heading: "Trust & safety",
    items: [
      {
        q: "How is my data protected?",
        a: "Connections are consent-based and access is enforced at the database level. We align with India's DPDP and GDPR principles, including the right to erasure.",
      },
      {
        q: "I found a suspicious listing. What do I do?",
        a: "Use the report option on the listing. Our team reviews every report and moderates or removes listings that break the rules.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Help & FAQ</h1>
      <p className="text-muted-foreground mt-2">
        Everything you need to know. Still stuck?{" "}
        <Link href="/how-it-works" className="text-primary underline">
          See how Dwello works
        </Link>
        .
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-primary text-sm font-semibold tracking-wide uppercase">
              {section.heading}
            </h2>
            <div className="mt-3 divide-y rounded-2xl border">
              {section.items.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium">
                    {item.q}
                    <ChevronDown className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-muted-foreground px-5 pb-5 text-sm leading-relaxed">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
