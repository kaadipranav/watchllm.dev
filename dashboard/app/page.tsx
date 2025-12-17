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

export const metadata: Metadata = {
  title: "WatchLLM - Real-time LLM Intelligence | Cut AI Costs by 70%",
  description:
    "Unify AI costs across OpenAI, Claude, and Groq with semantic caching. Drop-in proxy for 70% cost savings on repeated API calls. No code changes required.",
  keywords: [
    "LLM",
    "AI",
    "semantic caching",
    "OpenAI",
    "Claude",
    "Groq",
    "API proxy",
    "cost optimization",
    "AI API gateway",
  ],
  openGraph: {
    title: "WatchLLM - Real-time LLM Intelligence | Cut AI Costs by 70%",
    description:
      "Drop-in proxy that unifies AI costs across OpenAI, Claude, and Groq with intelligent semantic caching.",
    type: "website",
    url: "https://watchllm.dev",
    siteName: "WatchLLM",
    locale: "en_US",
    images: [
      {
        url: "https://watchllm.dev/watchllm_logo.png",
        width: 1200,
        height: 630,
        alt: "WatchLLM - Real-time LLM Intelligence",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchLLM - Real-time LLM Intelligence | Cut AI Costs by 70%",
    description:
      "Drop-in proxy that unifies AI costs across OpenAI, Claude, and Groq with intelligent semantic caching.",
    creator: "@kaad_zz",
    images: {
      url: "https://watchllm.dev/watchllm_logo.png",
      alt: "WatchLLM Logo",
    },
  },
};

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col selection:bg-violet-500/30">
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-black" />

      <Navbar />
      <main className="flex-1">
        <Hero />
        <Providers />
        <LiveFlow />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
