"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Platform Showcase - Visual representation of observability + caching
 */
export function PlatformShowcase() {
  const features = [
    {
      title: "Semantic Caching",
      description: "Vector-based request matching for 70% cost savings",
      color: "from-cyan-400 to-blue-500",
      position: "top-left",
    },
    {
      title: "Real-time Observability",
      description: "Streams logs, metrics, and traces to ClickHouse",
      color: "from-violet-400 to-purple-500",
      position: "top-right",
    },
    {
      title: "Analytics Dashboard",
      description: "Request-scale insights powered by ClickHouse",
      color: "from-emerald-400 to-teal-500",
      position: "bottom-left",
    },
    {
      title: "Secure Key Management",
      description: "Provider + project keys unlock telemetry flow",
      color: "from-rose-400 to-pink-500",
      position: "bottom-right",
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
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
            Platform Architecture
          </h2>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            Observability-first platform
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Every request flows through our edge network for caching, observability, and analytics—all built on ClickHouse telemetry.
          </p>
        </motion.div>

        {/* Platform visualization */}
        <motion.div
          className="relative mt-20"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          {/* Main platform container */}
          <div className="relative bg-bg-surface/30 border border-border-subtle rounded-2xl p-12 backdrop-blur-sm overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 pointer-events-none">
              <svg
                className="w-full h-full opacity-[0.02]"
                width="100%"
                height="100%"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Glow effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 blur-[80px] rounded-full" />
              <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 blur-[80px] rounded-full" />
            </div>

            <div className="relative space-y-8">
              {/* Top tier: Input → Cache */}
              <motion.div
                className="flex flex-col md:flex-row items-center justify-between gap-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {/* Input - API Requests */}
                <div className="flex-1 bg-bg-elevated/50 border border-border-subtle rounded-xl p-6">
                  <h3 className="font-semibold text-text-primary mb-2">API Requests</h3>
                  <p className="text-sm text-text-secondary">
                    OpenAI, Claude, Groq, or any LLM endpoint
                  </p>
                </div>

                {/* Professional Arrow */}
                <div className="hidden md:flex items-center justify-center flex-shrink-0">
                  <div className="flex items-center">
                    <div className="w-16 h-[2px] bg-white/30" />
                    <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  </div>
                </div>

                {/* Semantic Cache */}
                <div className="flex-1 bg-bg-elevated/50 border border-border-subtle rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                  <div className="relative">
                    <h3 className="font-semibold text-text-primary mb-3">Semantic Cache</h3>
                    <p className="text-sm text-text-secondary mb-3">
                      Vector matching + cosine similarity = 70% savings
                    </p>
                    <div className="mt-3 text-xs text-white font-mono bg-white/5 px-2 py-1 rounded border border-white/20">
                      95%+ match accuracy
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Middle tier: Processing */}
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-[2px] h-8 bg-white/30" />
                  <svg className="w-6 h-6 text-white drop-shadow-lg -mt-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                  </svg>
                </div>
              </motion.div>

              {/* Bottom tier: Observability */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {/* ClickHouse Telemetry */}
                <div className="bg-bg-elevated/50 border border-border-subtle rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                  <div className="relative">
                    <h3 className="font-semibold text-text-primary mb-3">Telemetry Stream</h3>
                    <p className="text-sm text-text-secondary mb-3">
                      Logs, metrics, and traces flow to ClickHouse
                    </p>
                    <ul className="space-y-1 text-xs text-text-muted">
                      <li>✓ Request payloads (safe)</li>
                      <li>✓ Provider responses</li>
                      <li>✓ Latency metrics</li>
                    </ul>
                  </div>
                </div>

                {/* Analytics Dashboard */}
                <div className="bg-bg-elevated/50 border border-border-subtle rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                  <div className="relative">
                    <h3 className="font-semibold text-text-primary mb-3">Analytics + Alerts</h3>
                    <p className="text-sm text-text-secondary mb-3">
                      Real-time insights and anomaly detection
                    </p>
                    <ul className="space-y-1 text-xs text-text-muted">
                      <li>✓ Cache hit rate</li>
                      <li>✓ Cost forecasting</li>
                      <li>✓ Anomaly alerts</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Bottom tier: Key Management */}
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-[2px] h-6 bg-white/30" />
                  <svg className="w-6 h-6 text-white drop-shadow-lg -mt-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                  </svg>
                </div>
              </motion.div>

              {/* Bottom: Key Management */}
              <motion.div
                className="bg-bg-elevated/50 border border-border-subtle rounded-xl p-6 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                <div className="relative">
                  <h3 className="font-semibold text-text-primary mb-3">Provider + Project Keys</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Attach keys to unlock observability telemetry flow and secure access to ClickHouse analytics
                  </p>
                  <div className="text-xs text-white font-mono bg-white/5 px-2 py-1 rounded border border-white/20">
                    Required for observability features
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            >
              <div className="h-full bg-bg-surface border border-border-subtle rounded-lg p-5 hover:border-border-default transition-all duration-base hover:shadow-lg hover:shadow-accent-primary/5">
                <h4 className="font-semibold text-text-primary mb-2 text-sm">
                  {feature.title}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Key insight */}
        <motion.div
          className="mt-16 bg-gradient-to-r from-accent-primary/10 via-purple-500/5 to-accent-primary/10 border border-accent-primary/20 rounded-xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <p className="text-lg text-text-secondary">
            <span className="font-semibold text-text-primary">Every request</span> is cached, observed, and analyzed—giving you visibility into the cost and performance of your AI integrations.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
