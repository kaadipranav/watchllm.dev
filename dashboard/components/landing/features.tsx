"use client";

import { BarChart3, Code, Database, Globe, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    description: "SOC 2 ready with end-to-end encryption, audit logs, and secrets rotation baked-in.",
    icon: Shield,
    gradient: "from-rose-500/30 via-pink-500/20 to-transparent",
  },
  {
    title: "Multi-Provider",
    description: "Unified API for OpenAI, Anthropic, Groq, and custom local models. Switch providers without rewriting call logic.",
    icon: Database,
    badge: "Provider neutral",
    gradient: "from-indigo-500/30 via-blue-500/20 to-transparent",
  },
];

export function Features() {
  return (
    <section id="features" className="relative isolate overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_35%)]" />
      <div className="absolute inset-x-0 top-2/3 h-[400px] bg-gradient-to-b from-transparent via-white/5 to-white/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-premium-text-muted">Features</p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight text-premium-text-primary sm:text-5xl">
            Everything you need for
            <br />
            <span className="text-gradient-accent">AI availability</span>
          </h2>
          <p className="mt-5 text-lg text-premium-text-secondary">
            A curated suite of controls that keep your AI layer reliable, observable, and cost-efficient.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const accentDelay = index * 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: accentDelay, duration: 0.55 }}
      className={cn(
        "group relative isolate overflow-hidden rounded-[32px] border border-white/[0.05] bg-white/[0.03] p-6 sm:p-8 shadow-[0_25px_80px_rgba(15,23,42,0.35)] backdrop-blur",
        feature.size === "wide" ? "lg:col-span-2" : "",
        feature.size === "tall" ? "xl:row-span-2" : ""
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br",
          feature.gradient
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-premium-text-muted">
          <span>Capability</span>
          {feature.badge ? (
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-[0.65rem] font-semibold text-premium-text-primary">
              {feature.badge}
            </span>
          ) : (
            <span className="h-0.5 w-10 rounded-full bg-white/20" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.06]">
            <feature.icon className="h-5 w-5 text-premium-text-secondary" />
          </div>
          <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
        </div>

        <p className="text-sm leading-relaxed text-premium-text-muted">{feature.description}</p>
      </div>

      <div className="pointer-events-none absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-white/10 blur-3xl opacity-30" />
    </motion.div>
  );
}

