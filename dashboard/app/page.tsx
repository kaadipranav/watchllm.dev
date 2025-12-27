import type { Metadata } from "next";
import { Providers } from "@/components/landing/providers";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { LiveFlow } from "@/components/landing/live-flow";
import { AuthCallbackHandler } from "@/components/auth/auth-callback-handler";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "WatchLLM - Real-time Semantic Caching | Cut AI API Costs by 70%",
  description:
    "Unify AI costs across OpenAI, Claude, and Groq with true semantic caching. Vector similarity matching with 95%+ accuracy. Drop-in proxy for 70% cost savings on repeated API calls. No code changes required.",
  keywords: [
    "semantic caching",
    "vector similarity",
    "AI API proxy",
    "OpenAI cost reduction",
    "Claude API savings",
    "Groq optimization",
    "LLM caching",
    "cosine similarity",
    "API cost optimization",
    "AI gateway",
    "chat completions cache",
    "embeddings cache",
    "reduce AI costs",
    "intelligent caching",
    "vector database"
  ],
  openGraph: {
    title: "WatchLLM - Real-time Semantic Caching | Cut AI API Costs by 70%",
    description:
      "Drop-in proxy with true semantic caching and vector similarity matching. Unify AI costs across OpenAI, Claude, and Groq with 95%+ accuracy.",
    type: "website",
    url: "https://watchllm.dev",
    siteName: "WatchLLM",
    locale: "en_US",
    images: [
      {
        url: "https://watchllm.dev/og-homepage-1200x630.png",
        width: 1200,
        height: 630,
        alt: "WatchLLM - Semantic Caching for AI APIs",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchLLM - Real-time Semantic Caching | Cut AI API Costs by 70%",
    description:
      "True semantic caching with vector similarity matching. Drop-in proxy for OpenAI, Claude, and Groq APIs with 95%+ accuracy.",
    creator: "@kaad_zz",
    site: "@watchllm",
    images: {
      url: "https://watchllm.dev/twitter-home-1200x600.png",
      alt: "WatchLLM Semantic Caching Architecture",
      width: 1200,
      height: 600,
    },
  },
  alternates: {
    canonical: "https://watchllm.dev",
  },
};

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col selection:bg-white/10">
      {/* Minimal dark grid + subtle top glow (Vercel/Linear-inspired) */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-bg-primary">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,hsl(var(--accent-primary)_/_0.10),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-[240px] bg-gradient-to-t from-bg-primary to-transparent" />
      </div>

      <Navbar />
      <main className="flex-1">
        <Suspense fallback={null}>
          <AuthCallbackHandler />
        </Suspense>
        <Hero />
        <Providers />
        <HowItWorks />
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
