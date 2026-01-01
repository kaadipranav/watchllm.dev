"use client";

import { Activity, BarChart3, Database, Globe, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  metric?: string;
  gradient: string;
};

const features: Feature[] = [
  {
    title: "Observability Control Plane",
    description:
      "Attach project + provider keys, enforce retention, and stream logs/metrics safely into ClickHouse without touching infrastructure.",
    icon: Activity,
    metric: "Keyed access",
    gradient: "from-accent-primary to-accent-purple",
  },
  {
    title: "Semantic Caching",
    description:
      "Vector-based caching that understands intent. 95%+ accuracy with cosine similarity matching delivers massive cost savings and faster responses.",
    icon: Zap,
    metric: "70% savings",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    title: "Analytics & Alerts",
    description:
      "Request-scale analytics, anomaly detection, and usage forecasts powered by ClickHouse so you can optimize spend in real time.",
    icon: BarChart3,
    metric: "Real-time insights",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    title: "Trace + Log Explorer",
    description:
      "Collect provider responses, prompts, and traces with configurable retention so you can debug confidently without exposing secrets.",
    icon: Shield,
    metric: "ClickHouse-ready logs",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    title: "Zero Integration",
    description:
      "Drop-in OpenAI-compatible proxy—swap one endpoint, keep your code, and gain caching plus telemetry within minutes.",
    icon: Database,
    metric: "5 min setup",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    title: "Global Edge Observability",
    description:
      "Cloudflare Workers stream telemetry worldwide with sub-50ms latency while forwarding observability data to the dashboard.",
    icon: Globe,
    metric: "<50ms",
    gradient: "from-indigo-500 to-purple-500",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export function Features() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-4">
            Features
          </h2>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            Observability-first caching that scales
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Built for developers who need reliability, telemetry, and cost efficiency at scale.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative"
            >
              {/* Card */}
              <div className="h-full bg-bg-surface border border-border-subtle rounded-lg p-6 transition-colors duration-base hover:border-border-default">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-bg-elevated border border-border-subtle">
                    <feature.icon className="h-6 w-6 text-text-primary" />
                  </div>

                  {/* Metric badge */}
                  {feature.metric && (
                    <div className="absolute -top-2 -right-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-medium uppercase tracking-wider bg-bg-elevated text-text-muted border border-border-subtle">
                        {feature.metric}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm text-text-muted">
            And much more. Explore our{" "}
            <a
              href="/docs"
              className="text-accent-primary hover:underline transition-colors"
            >
              documentation and observability guides
            </a>{" "}
            to learn about all features.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
