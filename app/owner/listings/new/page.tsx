import { ListingWizard } from "@/components/listings/listing-wizard";

export const metadata = {
  title: "List your property",
};

export default function NewListingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold">List your property</h1>
      <p className="text-muted-foreground mt-1">
        A guided, category-specific flow — publish in a few minutes,
        broker-free.
      </p>
      <div className="mt-8">
        <ListingWizard />
      </div>
    </main>
  );
}
