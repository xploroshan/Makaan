"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { CompareProvider } from "@/components/compare/compare-provider";
import { ShortlistProvider } from "@/components/shortlist/shortlist-provider";
import { ThemeProvider } from "@/components/theme-provider";

/** Client-side app providers: theming, query cache, shortlist & compare state. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ShortlistProvider>
          <CompareProvider>{children}</CompareProvider>
        </ShortlistProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
