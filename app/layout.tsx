import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { MicrosoftClarity } from "@/components/analytics/MicrosoftClarity";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Virl.in | Viral Content OS",
  description: "Enterprise operating system for viral content creation.",
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased`}
        style={{ fontStyle: 'normal' }}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
        <MicrosoftClarity />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
