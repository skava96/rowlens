import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "../components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rowlens.vercel.app"),

  title: {
    default: "RowLens",
    template: "%s | RowLens",
  },

  description:
    "Browser-first dataset review platform built with Next.js, React, TypeScript, and local AI inference using WebLLM.",

  keywords: [
    "Next.js",
    "React",
    "TypeScript",
    "WebLLM",
    "AI",
    "Dataset Review",
    "Data Quality",
    "Portfolio",
    "Frontend",
  ],

  authors: [
    {
      name: "Steffi Kavalakat",
    },
  ],

  icons: {
    icon: [
      { url: "/favicons/favicon.svg", type: "image/svg+xml" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicons/apple-touch-icon.png",
  },

  openGraph: {
    title: "RowLens",
    description:
      "Browser-first dataset review platform with local Pattern Discovery powered by WebLLM.",

    url: "https://rowlens.vercel.app",

    siteName: "RowLens",

    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "RowLens Workspace",
      },
    ],

    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "RowLens",
    description:
      "Browser-first dataset review platform with local Pattern Discovery powered by WebLLM.",

    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
