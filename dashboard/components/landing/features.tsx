"use client";

import { BarChart3, Code, Database, Globe, Shield, Zap } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  gradient: string;
  size?: "wide" | "tall";
};

const features: Feature[] = [
  {
    title: "Semantic Caching",
    description:
      "Intelligent caching that understands intent, saving you up to 70% on repeated API calls without stale responses.",
    icon: Zap,
    badge: "70% savings",
    gradient: "from-violet-500/40 via-purple-500/20 to-transparent",
    size: "wide",
  },
  {
    title: "Zero Code Changes",
    description: "Swap a single endpoint and keep your existing OpenAI SDKs. No client-level refactors required.",
    icon: Code,
    badge: "Drop-in",
    gradient: "from-cyan-500/30 via-blue-500/20 to-transparent",
  },
  {
    title: "Global Edge Network",
    description: "Deployed across Cloudflare’s global backbone with sub-50ms tails and smart routing.",
    icon: Globe,
    gradient: "from-emerald-500/30 via-teal-500/20 to-transparent",
  },
  {
    title: "Real-time Analytics",
    description: "Monitor cost, latency, and model drift by project, user, or workspace in seconds.",
    icon: BarChart3,
    badge: "Live data",
    gradient: "from-amber-500/30 via-orange-500/20 to-transparent",
    size: "wide",
  },
  {
    title: "Enterprise Security",
    description: "End-to-end encryption, audit logs, and secrets rotation baked-in.",
    icon: Shield,
    gradient: "from-rose-500/30 via-pink-500/20 to-transparent",
  },
  {
    title: "Multi-Provider Access",
    description: "BYOK support for OpenAI, Anthropic, Groq, and OpenRouter. Unified API for simplified multi-model deployments.",
    icon: Database,
    badge: "BYOK enabled",
    gradient: "from-indigo-500/30 via-blue-500/20 to-transparent",
  },
];

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section id="features" ref={containerRef} className="relative isolate py-24 sm:py-32 overflow-visible">
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_35%)] pointer-events-none" />

      {/* Removed the white haze gradient from here per user request */}

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 lg:items-start">

          {/* Sticky Left Header */}
          <div className="lg:sticky lg:top-32 lg:w-1/2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-sm font-semibold leading-7 text-premium-text-muted tracking-widest uppercase mb-2">Features</h2>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-premium-text-primary mb-6">
                Everything you need for
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">AI availability</span>
              </h1>
              <p className="max-w-md text-lg text-premium-text-secondary leading-relaxed">
                A curated suite of controls that keep your AI layer reliable, observable, and cost-efficient. Experience the power of semantic intelligence at the edge.
              </p>

              <div className="pt-8 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-sm text-premium-text-muted">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  <span>Scroll through to explore all capabilities</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scrolling Features List - No internal scrollbar, uses page scroll */}
          <div className="lg:w-1/2 space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="group relative flex gap-6 p-8 bg-white/[0.03] hover:bg-white/[0.06] rounded-[32px] border border-white/[0.08] hover:border-white/[0.12] transition-all duration-500 backdrop-blur-sm shadow-premium-sm"
              >
                {/* Accent Background */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br rounded-[32px]",
                  feature.gradient
                )} />

                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.1] text-purple-300 group-hover:scale-110 group-hover:text-purple-200 transition-all duration-500">
                  <feature.icon className="h-6 w-6" />
                </div>

                <div className="relative z-10 flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-premium-text-primary group-hover:text-white transition-colors">
                      {feature.title}
                    </h3>
                    {feature.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full ring-1 ring-inset ring-violet-500/20">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-premium-text-secondary leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
