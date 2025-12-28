import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const sans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-sans',
});

const display = Outfit({
  subsets: ["latin"],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: "WatchLLM - Cut Your AI API Costs by 40-70% | Semantic Caching Proxy",
  description:
    "WatchLLM is a drop-in proxy that reduces your OpenAI, Claude, and Groq API costs through intelligent semantic caching. Real-time vector similarity matching with 95%+ accuracy. No code changes required.",
  keywords: [
    "AI API proxy",
    "semantic caching",
    "OpenAI cost reduction",
    "Claude API savings",
    "Groq optimization",
    "LLM caching",
    "vector similarity",
    "API cost optimization",
    "AI gateway",
    "chat completions cache",
    "embeddings cache",
    "API proxy service",
    "reduce AI costs",
    "intelligent caching",
    "vector database",
    "cosine similarity"
  ],
  authors: [{ name: "Pranav Kaadi", url: "https://watchllm.dev" }],
  creator: "Pranav Kaadi",
  publisher: "WatchLLM",
  category: "Technology",
  classification: "Developer Tools",
  referrer: "no-referrer-when-downgrade",
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
    title: "WatchLLM - Cut Your AI API Costs by 40-70% | Semantic Caching",
    description:
      "Drop-in proxy with true semantic caching. Vector similarity matching for OpenAI, Claude, and Groq APIs. Real-time cost optimization with 95%+ accuracy.",
    type: "website",
    url: "https://watchllm.dev",
    siteName: "WatchLLM",
    locale: "en_US",
    images: [
      {
        url: "https://watchllm.dev/og-image-1200x630.png",
        width: 1200,
        height: 630,
        alt: "WatchLLM - AI API Cost Optimization with Semantic Caching",
        type: "image/png",
      },
      {
        url: "https://watchllm.dev/og-image-800x400.png",
        width: 800,
        height: 400,
        alt: "WatchLLM Semantic Caching Architecture",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchLLM - Cut AI API Costs by 40-70% with Semantic Caching",
    description:
      "True semantic caching with vector similarity. Drop-in proxy for OpenAI, Claude, and Groq. Real-time cost optimization.",
    creator: "@kaad_zz",
    site: "@watchllm",
    images: {
      url: "https://watchllm.dev/twitter-card-1200x600.png",
      alt: "WatchLLM - Semantic Caching for AI APIs",
      width: 1200,
      height: 600,
    },
  },
  alternates: {
    canonical: "https://watchllm.dev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  other: {
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
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
      "description": "Free tier with 50,000 requests/month"
    },
    "description": "WatchLLM is a drop-in proxy that reduces your OpenAI, Claude, and Groq API costs through intelligent semantic caching with vector similarity matching.",
    "url": "https://watchllm.dev",
    "author": {
      "@type": "Person",
      "name": "Pranav Kaadi",
      "url": "https://watchllm.dev"
    },
    "publisher": {
      "@type": "Organization",
      "name": "WatchLLM",
      "url": "https://watchllm.dev"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "120",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Semantic caching with vector similarity",
      "OpenAI API proxy",
      "Claude API proxy", 
      "Groq API proxy",
      "Real-time cost optimization",
      "95%+ accuracy matching",
      "No code changes required",
      "Dashboard analytics",
      "Usage tracking"
    ],
    "softwareVersion": "1.0.0",
    "datePublished": "2024-01-01",
    "dateModified": "2024-12-18",
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
    "keywords": "AI API proxy, semantic caching, OpenAI cost reduction, vector similarity, API optimization"
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
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
