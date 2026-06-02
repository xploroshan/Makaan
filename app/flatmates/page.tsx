import { Sparkles } from "lucide-react";
import Link from "next/link";

import { FlatmateBrowser } from "@/components/flatmates/flatmate-browser";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Find a flatmate",
  description:
    "Find compatible flatmates by lifestyle, budget and area — broker-free, with real compatibility scores.",
};

export default function FlatmatesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Find a flatmate</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <Sparkles className="text-gold size-4" />
            Matched on lifestyle — not just budget. The flatmate search that
            actually fits.
          </p>
        </div>
        <Button asChild className="rounded-full px-6">
          <Link href="/flatmates/new">Post a flatmate ad</Link>
        </Button>
      </div>

      <div className="mt-6">
        <FlatmateBrowser />
      </div>
    </main>
  );
}
