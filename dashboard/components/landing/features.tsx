"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Feature = {
  title: string;
  description: string;
  metric?: string;
};

const features: Feature[] = [
  {
    title: "Stop Paying Twice",
    description:
      "Similar questions get the same answers. WatchLLM detects when your users ask semantically similar prompts and returns cached responses instantly.",
    metric: "40-70% savings",
  },
  {
    title: "See Your Waste",
    description:
      "Your dashboard shows exactly how much money you're losing to duplicate requests. Watch it shrink as caching kicks in.",
    metric: "Real-time",
  },
  {
    title: "5 Minute Setup",
    description:
      "Change your API base URL. That's it. No code changes, no infrastructure, no migrations. Works with your existing OpenAI/Anthropic/Groq code.",
    metric: "1 line change",
  },
  {
    title: "Faster Responses",
    description:
      "Cache hits return in under 50ms instead of waiting 1-3 seconds for the API. Your users get instant answers.",
    metric: "<50ms",
  },
  {
    title: "Usage Alerts",
    description:
      "Get notified when you hit 80% of your budget or when a specific endpoint starts burning through cash unexpectedly.",
    metric: "Email alerts",
  },
  {
    title: "Request History",
    description:
      "Every request is logged with cost, latency, and cache status. Export to CSV for your accountant or dig into the data yourself.",
    metric: "Full logs",
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
            Why WatchLLM
          </h2>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            Cut your AI bill without cutting features
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Most apps send duplicate or near-duplicate prompts. You're paying full price every time. We fix that.
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
              <div className="h-full bg-bg-surface border border-border-subtle rounded-lg p-8 transition-colors duration-base hover:border-border-default">
                {/* Metric badge */}
                {feature.metric && (
                  <div className="mb-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-medium uppercase tracking-wider bg-bg-elevated text-text-muted border border-border-subtle">
                      {feature.metric}
                    </span>
                  </div>
                )}

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
            Explore our{" "}
            <a
              href="/docs"
              className="text-text-primary underline hover:text-text-secondary transition-colors"
            >
              documentation
            </a>{" "}
            to learn more.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
