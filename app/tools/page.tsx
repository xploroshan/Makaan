import { EmiCalculator } from "@/components/tools/emi-calculator";
import { RentAffordability } from "@/components/tools/rent-affordability";

export const metadata = {
  title: "Home calculators",
  description:
    "Free EMI and rent-affordability calculators to plan your home budget.",
};

export default function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Plan your budget</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
          Know what you can afford before you fall in love with a place. No
          sign-up, no sharing your data — these run right in your browser.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <EmiCalculator />
        <RentAffordability />
      </div>

      <p className="text-muted-foreground mt-8 text-center text-xs">
        Estimates only. Actual loan terms depend on your lender and eligibility.
      </p>
    </main>
  );
}
