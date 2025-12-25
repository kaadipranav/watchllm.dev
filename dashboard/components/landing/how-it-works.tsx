"use client";

import { motion } from "framer-motion";
import { Database, Server, Zap } from "lucide-react";

const steps = [
  {
    icon: Server,
    title: "Request Interception",
    step: "01",
    description: "You change your baseURL to WatchLLM. We intercept the request at the edge (Cloudflare Workers) with 0ms cold start.",
    gradient: "from-cyan-500/20 to-blue-500/10",
    iconColor: "text-cyan-400",
    accentColor: "bg-cyan-500",
  },
  {
    icon: Database,
    title: "Semantic Lookup",
    step: "02",
    description: "We vectorize your prompt and check our Redis vector database for semantically similar previous queries (95% similarity default).",
    gradient: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    accentColor: "bg-violet-500",
  },
  {
    icon: Zap,
    title: "Cache Hit (or Miss)",
    step: "03",
    description: "If found, we return the cached response instantly (50ms). If not, we forward to your provider (OpenAI, Anthropic, OpenRouter, etc.) and cache it.",
    gradient: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
    accentColor: "bg-amber-500",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <p className="text-sm font-medium text-violet-400 mb-4">How it works</p>
          <h2 className="text-4xl font-bold tracking-tight text-premium-text-primary sm:text-5xl">
            Three steps to
            <br />
            <span className="text-gradient-accent">massive savings</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-premium-text-secondary">
            Intelligent semantic caching that sits transparently between your app and the AI provider.
          </p>
        </motion.div>

        {/* JetBrains/OpenAI inspired cards */}
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-px ${step.accentColor} opacity-50`} />

                <div className="relative z-10 flex flex-col h-full">
                  {/* Step number */}
                  <span className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-premium-text-muted mb-4">
                    Step {step.step}
                  </span>

                  {/* Icon */}
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    <step.icon className={`h-6 w-6 ${step.iconColor}`} />
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-premium-text-primary tracking-tight">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-premium-text-muted group-hover:text-premium-text-secondary transition-colors duration-300">
                    {step.description}
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
