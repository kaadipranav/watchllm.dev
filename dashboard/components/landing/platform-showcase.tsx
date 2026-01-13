"use client";

import { motion } from "framer-motion";

/**
 * Platform Showcase - Visual representation of observability + caching
 */
export function PlatformShowcase() {
  const features = [
    {
      title: "Semantic Caching",
      description: "Vector-based request matching for 70% cost savings",
    },
    {
      title: "Real-time Observability",
      description: "Streams logs, metrics, and traces to ClickHouse",
    },
    {
      title: "Analytics Dashboard",
      description: "Request-scale insights powered by ClickHouse",
    },
    {
      title: "Secure Key Management",
      description: "Provider + project keys unlock telemetry flow",
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
          className="relative mt-16"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          {/* Main platform container */}
          <div className="relative bg-bg-surface/30 border border-border-subtle rounded-xl p-8 backdrop-blur-sm overflow-hidden">
            <div className="relative space-y-6">
              {/* Top tier: Input → Cache */}
              <motion.div
                className="flex flex-col md:flex-row items-center justify-between gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {/* Input - API Requests */}
                <div className="flex-1 bg-bg-elevated/50 border border-border-subtle rounded-lg p-4">
                  <h3 className="font-semibold text-text-primary mb-1">API Requests</h3>
                  <p className="text-xs text-text-secondary">
                    OpenAI, Claude, Groq, or any LLM endpoint
                  </p>
                </div>

                {/* Professional Arrow */}
                <div className="hidden md:flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                  </svg>
                </div>

                {/* Semantic Cache */}
                <div className="flex-1 bg-bg-elevated/50 border border-border-subtle rounded-lg p-4">
                  <h3 className="font-semibold text-text-primary mb-1">Semantic Cache</h3>
                  <p className="text-xs text-text-secondary mb-2">
                    Vector matching + cosine similarity = 70% savings
                  </p>
                  <div className="text-[10px] text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/20 inline-block">
                    95%+ match accuracy
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
                <svg className="w-5 h-5 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </motion.div>

              {/* Bottom tier: Observability */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {/* ClickHouse Telemetry */}
                <div className="bg-bg-elevated/50 border border-border-subtle rounded-lg p-4">
                  <h3 className="font-semibold text-text-primary mb-1">Telemetry Stream</h3>
                  <p className="text-xs text-text-secondary mb-2">
                    Logs, metrics, and traces flow to ClickHouse
                  </p>
                  <ul className="space-y-0.5 text-[10px] text-text-muted">
                    <li>✓ Request payloads (safe)</li>
                    <li>✓ Provider responses</li>
                    <li>✓ Latency metrics</li>
                  </ul>
                </div>

                {/* Analytics Dashboard */}
                <div className="bg-bg-elevated/50 border border-border-subtle rounded-lg p-4">
                  <h3 className="font-semibold text-text-primary mb-1">Analytics + Alerts</h3>
                  <p className="text-xs text-text-secondary mb-2">
                    Real-time insights and anomaly detection
                  </p>
                  <ul className="space-y-0.5 text-[10px] text-text-muted">
                    <li>✓ Cache hit rate</li>
                    <li>✓ Cost forecasting</li>
                    <li>✓ Anomaly alerts</li>
                  </ul>
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
                <svg className="w-5 h-5 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </motion.div>

              {/* Bottom: Key Management */}
              <motion.div
                className="bg-bg-elevated/50 border border-border-subtle rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <h3 className="font-semibold text-text-primary mb-1">Provider + Project Keys</h3>
                <p className="text-xs text-text-secondary mb-2">
                  Attach keys to unlock observability telemetry flow and secure access to ClickHouse analytics
                </p>
                <div className="text-[10px] text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/20 inline-block">
                  Required for observability features
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
              <div className="h-full bg-bg-surface border border-border-subtle rounded-lg p-5 hover:border-border-default transition-all duration-base hover:shadow-lg hover:shadow-white/5">
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
          className="mt-16 bg-white/5 border border-white/10 rounded-xl p-8 text-center"
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
