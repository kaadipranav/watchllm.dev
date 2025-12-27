"use client";

import { BarChart3, Code, Database, Globe, Shield, Zap } from "lucide-react";
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
    title: "Semantic Caching",
    description:
      "Intelligent vector-based caching that understands intent. 95%+ accuracy with cosine similarity matching for massive cost savings.",
    icon: Zap,
    metric: "70% savings",
    gradient: "from-accent-primary to-accent-purple",
  },
  {
    title: "Zero Integration",
    description: "Drop-in OpenAI-compatible proxy. Swap one endpoint and keep your existing code. No refactoring required.",
    icon: Code,
    metric: "5min setup",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    title: "Global Edge Network",
    description: "Deployed on Cloudflare Workers with sub-50ms latency worldwide. Automatic routing to nearest edge.",
    icon: Globe,
    metric: "<50ms",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    title: "Real-time Analytics",
    description: "Monitor costs, cache hits, and performance by project in real-time. Actionable insights at your fingertips.",
    icon: BarChart3,
    metric: "Live data",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    title: "Enterprise Security",
    description: "End-to-end encryption, audit logs, and BYOK support. Your keys, your data, your control.",
    icon: Shield,
    metric: "SOC 2 ready",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    title: "Multi-Provider",
    description: "Unified API for OpenAI, Claude, Groq, and more via OpenRouter. One integration, all models.",
    icon: Database,
    metric: "BYOK",
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
            Everything you need for intelligent caching
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Built for developers who need reliability, performance, and cost efficiency at scale.
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
              documentation
            </a>{" "}
            to learn about all features.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
