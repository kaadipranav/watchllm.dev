import type { Metadata } from "next";
import { Providers } from "@/components/landing/providers";
import { PowerFeatures } from "@/components/landing/power-features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PlatformShowcase } from "@/components/landing/platform-showcase";
import { Testimonials } from "@/components/landing/testimonials";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Enterprise } from "@/components/landing/enterprise";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { LiveFlow } from "@/components/landing/live-flow";
import { DataFlow } from "@/components/landing/data-flow";
import { AuthCallbackHandler } from "@/components/auth/auth-callback-handler";
import { Suspense } from "react";
import DotGrid from "@/components/landing/dot-grid";

export const metadata: Metadata = {
  title: "WatchLLM - Cut Your OpenAI Bill by 40-70%",
  description:
    "Stop paying twice for similar AI requests. WatchLLM caches semantically similar prompts so you only pay once. See your savings in real-time. 5 minute setup.",
  keywords: [
    "reduce OpenAI costs",
    "cut AI API bill",
    "OpenAI cost reduction",
    "Claude API savings",
    "AI caching",
    "LLM cost optimization",
    "semantic caching",
    "API cost savings",
    "reduce AI spend",
    "ChatGPT API cheaper",
    "AI API proxy",
    "save money on AI"
  ],
  openGraph: {
    title: "WatchLLM - Cut Your OpenAI Bill by 40-70%",
    description:
      "Stop paying twice for similar AI requests. Cache semantically similar prompts and see your savings in real-time.",
    type: "website",
    url: "https://watchllm.dev",
    siteName: "WatchLLM",
    locale: "en_US",
    images: [
      {
        url: "https://watchllm.dev/og-homepage-1200x630.png",
        width: 1200,
        height: 630,
        alt: "WatchLLM - Cut Your OpenAI Bill",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchLLM - Cut Your OpenAI Bill by 40-70%",
    description:
      "Stop paying twice for similar AI requests. See your savings in real-time.",
    creator: "@kaad_zz",
    site: "@watchllm",
    images: {
      url: "https://watchllm.dev/twitter-home-1200x600.png",
      alt: "WatchLLM - Cut Your OpenAI Bill",
      width: 1200,
      height: 600,
    },
  },
  alternates: {
    canonical: "https://watchllm.dev",
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "WatchLLM",
    "url": "https://watchllm.dev",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://watchllm.dev/docs?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col selection:bg-white/10 max-w-[100vw]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Dot Grid interactive background - hero section with fade */}
      <div className="absolute inset-x-0 top-0 h-[120vh] pointer-events-auto z-[-1] overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 85%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 85%, rgba(0,0,0,0) 100%)'
        }}
      >
        <DotGrid
          dotSize={4}
          gap={20}
          baseColor="#271E37"
          activeColor="#5227FF"
          proximity={200}
          shockRadius={250}
          shockStrength={5}
          resistance={800}
          returnDuration={1.5}
        />
      </div>

      <Navbar />
      {/* Skip to content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-md focus:outline-none"
      >
        Skip to main content
      </a>
      <main id="main-content" className="flex-1 max-w-[96rem] mx-auto w-full" role="main">
        <Suspense fallback={null}>
          <AuthCallbackHandler />
        </Suspense>
        <Hero />
        <Providers />
        <PowerFeatures />
        <DataFlow />
        <HowItWorks />
        <PlatformShowcase />
        <Features />
        <Pricing />
        <Enterprise />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
