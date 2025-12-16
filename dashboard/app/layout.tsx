import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WatchLLM - Cut Your AI API Costs by 40-70%",
  description:
    "WatchLLM is a drop-in proxy that reduces your OpenAI, Claude, and Groq API costs through intelligent semantic caching.",
  keywords: ["AI", "OpenAI", "API", "proxy", "caching", "cost reduction", "LLM"],
  authors: [{ name: "WatchLLM" }],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "WatchLLM - Cut Your AI API Costs by 40-70%",
    description:
      "Drop-in proxy that reduces your OpenAI, Claude, and Groq API costs through intelligent semantic caching.",
    type: "website",
    url: "https://watchllm.com",
    siteName: "WatchLLM",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchLLM - Cut Your AI API Costs by 40-70%",
    description:
      "Drop-in proxy that reduces your OpenAI, Claude, and Groq API costs through intelligent semantic caching.",
  },
  alternates: {
    canonical: "https://watchllm.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "WatchLLM",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Cloud",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "description": "WatchLLM is a drop-in proxy that reduces your OpenAI, Claude, and Groq API costs through intelligent semantic caching.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "120"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js" strategy="afterInteractive" defer />
        <noscript>
          <img src="https://queue.simpleanalyticscdn.com/noscript.gif" alt="" referrerPolicy="no-referrer-when-downgrade" />
        </noscript>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
