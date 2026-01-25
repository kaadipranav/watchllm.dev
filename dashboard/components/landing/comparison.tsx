"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const competitors = [
  {
    feature: "Semantic Caching",
    watchllm: { value: "✅ 40-70% savings", highlight: true },
    helicone: "❌",
    langsmith: "❌",
    portkey: "❌",
  },
  {
    feature: "Agent Debugging",
    watchllm: { value: "✅ Step-by-step", highlight: false },
    helicone: "Partial",
    langsmith: "✅",
    portkey: "Partial",
  },
  {
    feature: "Self-Hosted",
    watchllm: { value: "✅ Full isolation", highlight: true },
    helicone: "❌",
    langsmith: "❌",
    portkey: "❌",
  },
  {
    feature: "Setup",
    watchllm: { value: "1 line of code", highlight: false },
    helicone: "SDK required",
    langsmith: "Complex",
    portkey: "Medium",
  },
  {
    feature: "Pro Plan Price",
    watchllm: { value: "$99/mo", highlight: true },
    helicone: "$150/mo",
    langsmith: "$200/mo",
    portkey: "$99/mo",
  },
  {
    feature: "Cache Hit Speed",
    watchllm: { value: "<50ms", highlight: false },
    helicone: "N/A",
    langsmith: "N/A",
    portkey: "N/A",
  },
];

export function Comparison() {
  return (
    <section id="comparison" className="relative py-32 overflow-hidden">
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
            How We Compare
          </h2>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            Why teams choose WatchLLM
          </h1>
        </motion.div>

        {/* DIY vs WatchLLM */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* DIY Column */}
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-8">
              <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                <X className="w-5 h-5 text-red-400" />
                Building In-House
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                DIY semantic caching requires:
              </p>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5">•</span>
                  <span>Vector database setup (Pinecone/Weaviate)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5">•</span>
                  <span>Embedding pipeline management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5">•</span>
                  <span>Cache invalidation logic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5">•</span>
                  <span>3+ months engineering time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-text-muted mt-0.5">•</span>
                  <span>Ongoing maintenance</span>
                </li>
              </ul>
            </div>

            {/* WatchLLM Column */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-text-primary mb-6 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                WatchLLM
              </h3>
              <p className="text-lg font-medium text-text-primary mb-4">
                5 minutes to production, zero maintenance.
              </p>
              <p className="text-sm text-text-secondary">
                Drop-in proxy with semantic caching, agent debugging, and real-time analytics. 
                No infrastructure setup, no ongoing maintenance, no learning curve.
              </p>
              <div className="mt-6 pt-6 border-t border-border-subtle">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Engineering time saved:</span>
                  <span className="font-semibold text-green-400">3+ months</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Competitor comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-2xl font-semibold text-text-primary mb-8 text-center">
            vs. Other Platforms
          </h3>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-text-primary bg-purple-500/5">
                    WatchLLM
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-text-muted">
                    Helicone
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-text-muted">
                    LangSmith
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-text-muted">
                    Portkey
                  </th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx % 2 === 0 ? "bg-bg-surface/50" : ""}
                  >
                    <td className="py-4 px-4 text-sm font-medium text-text-secondary">
                      {row.feature}
                    </td>
                    <td className={`py-4 px-4 text-sm text-center font-medium bg-purple-500/5 ${
                      row.watchllm.highlight ? "text-green-400" : "text-text-primary"
                    }`}>
                      {row.watchllm.value}
                    </td>
                    <td className="py-4 px-4 text-sm text-center text-text-muted">
                      {row.helicone}
                    </td>
                    <td className="py-4 px-4 text-sm text-center text-text-muted">
                      {row.langsmith}
                    </td>
                    <td className="py-4 px-4 text-sm text-center text-text-muted">
                      {row.portkey}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-6">
            {competitors.map((row) => (
              <div
                key={row.feature}
                className="bg-bg-surface border border-border-subtle rounded-lg p-6"
              >
                <h4 className="font-semibold text-text-primary mb-4">{row.feature}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 px-3 bg-purple-500/5 rounded">
                    <span className="text-sm text-text-muted">WatchLLM</span>
                    <span className={`text-sm font-medium ${
                      row.watchllm.highlight ? "text-green-400" : "text-text-primary"
                    }`}>
                      {row.watchllm.value}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3">
                    <span className="text-sm text-text-muted">Helicone</span>
                    <span className="text-sm text-text-muted">{row.helicone}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3">
                    <span className="text-sm text-text-muted">LangSmith</span>
                    <span className="text-sm text-text-muted">{row.langsmith}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3">
                    <span className="text-sm text-text-muted">Portkey</span>
                    <span className="text-sm text-text-muted">{row.portkey}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footnote */}
          <p className="mt-8 text-xs text-text-muted text-center">
            Comparison accurate as of January 2026. Visit competitor sites for current pricing.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
