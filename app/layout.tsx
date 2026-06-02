import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";

import { CompareBar } from "@/components/compare/compare-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Dwello — Rent, Co-Live, Lease, Buy & Sell, broker-free",
    template: "%s · Dwello",
  },
  description:
    "Dwello is a broker-free property & co-living marketplace. Find or fill a home with verified listings, zero brokerage and zero spam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <CompareBar />
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
