import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import PlausibleProvider from "next-plausible";
import BetaBanner from "@/components/ui/BetaBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://happeningnow.travel"),
  title: "HappeningNow — Explore What's Happening Around the World",
  description:
    "An animated timeline map showing festivals, wildlife spectacles, and crowd levels worldwide. Scrub through months to discover what's happening and when.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <PlausibleProvider
          domain={
            process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "happeningnow.travel"
          }
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <BetaBanner />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
