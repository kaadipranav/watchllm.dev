"use client";

import { motion } from "framer-motion";

const earlyUsers = [
  {
    metric: "$847 → $312",
    description: "Monthly OpenAI bill after enabling caching",
    context: "ChatGPT wrapper app",
  },
  {
    metric: "63%",
    description: "Average cache hit rate in first week",
    context: "Across early beta users",
  },
  {
    metric: "2 min",
    description: "Average time to first cached request",
    context: "From signup to savings",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center mb-16"
        >
          <p className="text-sm font-medium text-text-muted mb-4">Early Results</p>
          <h2 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Real savings from beta users
          </h2>
          <p className="mt-4 text-text-secondary">
            We&apos;re in beta. These are actual numbers from early adopters.
          </p>
        </motion.div>

        {/* Results cards */}
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {earlyUsers.map((item, index) => (
              <motion.div
                key={item.metric}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-green-500/5 p-6 transition-all duration-300 hover:border-green-500/30 hover:bg-green-500/10"
              >
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {item.metric}
                </div>
                <p className="text-text-secondary leading-relaxed mb-3">
                  {item.description}
                </p>
                <p className="text-xs text-text-muted">
                  {item.context}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Honest disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-sm text-text-muted mt-8"
        >
          Results vary based on your prompt patterns. Repetitive prompts = higher savings.
        </motion.p>
      </div>
    </section>
  );
}
