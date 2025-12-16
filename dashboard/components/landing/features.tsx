"use client";

import {
  Zap,
  Database,
  Shield,
  BarChart3,
  Code,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Semantic Caching",
    description: "Intelligent caching that understands similar queries, not just exact matches. Save up to 70% on repeated API calls.",
    icon: Zap,
    className: "md:col-span-2",
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
  },
  {
    title: "Zero Code Changes",
    description: "Drop-in replacement for OpenAI SDKs. Change one URL and you're done.",
    icon: Code,
    className: "md:col-span-1",
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
  },
  {
    title: "Global Edge Network",
    description: "Deployed on Cloudflare's global network. <50ms latency worldwide.",
    icon: Globe,
    className: "md:col-span-1",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
  },
  {
    title: "Real-time Analytics",
    description: "Track costs by project, model, and user. See exactly where your money goes with granular insights.",
    icon: BarChart3,
    className: "md:col-span-2",
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
  },
  {
    title: "Enterprise Security",
    description: "SOC 2 compliant infrastructure. End-to-end encryption for all requests.",
    icon: Shield,
    className: "md:col-span-1",
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
  },
  {
    title: "Multi-Provider",
    description: "Unified API for OpenAI, Anthropic, and Groq. Switch providers seamlessly.",
    icon: Database,
    className: "md:col-span-1",
    gradient: "from-indigo-500/20 via-blue-500/10 to-transparent",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        {/* Dovetail/OpenAI style header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <p className="text-sm font-medium text-violet-400 mb-4">Features</p>
          <h2 className="text-4xl font-bold tracking-tight text-premium-text-primary sm:text-5xl">
            Everything you need for
            <br />
            <span className="text-gradient-accent">AI availability</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-premium-text-secondary">
            A comprehensive suite of tools designed to optimize your AI infrastructure.
          </p>
        </motion.div>

        {/* OpenAI-style card grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]",
                feature.className
              )}
            >
              {/* Gradient overlay on hover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                feature.gradient
              )} />

              {/* Top shine line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08]">
                  <feature.icon className="h-5 w-5 text-premium-text-secondary group-hover:text-premium-text-primary transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-premium-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-premium-text-muted leading-relaxed group-hover:text-premium-text-secondary transition-colors duration-300">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
