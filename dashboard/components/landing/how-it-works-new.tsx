"use client";

import { motion } from "framer-motion";
import { Database, Server, Zap, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Server,
    title: "Change one line",
    step: 1,
    description: "Update your baseURL to WatchLLM. We intercept requests at the edge with zero latency overhead.",
    code: `const client = new OpenAI({
  baseURL: "https://api.watchllm.com/v1",
  apiKey: process.env.WATCHLLM_KEY
});`,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Database,
    title: "Semantic matching",
    step: 2,
    description: "We vectorize your prompt and search our distributed cache for semantically similar queries using cosine similarity.",
    code: `// We automatically:
// 1. Vectorize your prompt
// 2. Search Redis vector DB
// 3. Find similar queries (>95% match)`,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Zap,
    title: "Instant response",
    step: 3,
    description: "Cache hit? Return in <50ms. Cache miss? Forward to your provider and cache the response for next time.",
    code: `// Cache hit: ~50ms response
// Cache miss: Normal latency
// Auto-caching for future requests`,
    gradient: "from-amber-500 to-orange-500",
  },
];

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      {/* Language badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-medium uppercase tracking-wider bg-bg-primary/80 text-text-muted border border-border-subtle">
          {language}
        </span>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 z-10 p-2 rounded-sm bg-bg-primary/80 border border-border-subtle hover:border-border-hover transition-colors"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-accent-success" />
        ) : (
          <Copy className="h-4 w-4 text-text-muted" />
        )}
      </button>

      {/* Code content */}
      <pre className="bg-black border border-border-subtle rounded-lg p-4 pt-10 overflow-x-auto">
        <code className="text-sm font-mono text-text-secondary leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-sm font-medium uppercase tracking-wider text-accent-primary mb-4">
            How It Works
          </h2>
          <h1 className="text-5xl font-bold tracking-tight text-text-primary mb-6">
            Three steps to
            <span className="block text-gradient-accent mt-2">70% cost savings</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Intelligent semantic caching that works transparently between your app and AI providers.
          </p>
        </motion.div>

        {/* Timeline - Desktop horizontal, Mobile vertical */}
        <div className="relative">
          {/* Desktop: Horizontal timeline */}
          <div className="hidden lg:block">
            {/* Connecting line */}
            <div className="absolute top-24 left-0 right-0 h-0.5 bg-border-subtle">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-primary to-accent-purple"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>

            <div className="grid grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  {/* Number badge */}
                  <div className="relative z-10 flex justify-center mb-12">
                    <div
                      className={cn(
                        "flex items-center justify-center w-16 h-16 rounded-full",
                        "bg-bg-surface border-2",
                        "bg-gradient-to-br",
                        step.gradient,
                        "border-border-hover"
                      )}
                    >
                      <span className="text-2xl font-bold text-white">
                        {step.step}
                      </span>
                    </div>
                  </div>

                  {/* Content card */}
                  <div className="bg-bg-surface border border-border-subtle rounded-lg p-6 hover:border-border-hover transition-all duration-base">
                    <div
                      className={cn(
                        "inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4",
                        "bg-gradient-to-br",
                        step.gradient
                      )}
                    >
                      <step.icon className="h-6 w-6 text-white" />
                    </div>

                    <h3 className="text-xl font-semibold text-text-primary mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed mb-4">
                      {step.description}
                    </p>

                    <CodeBlock code={step.code} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile: Vertical timeline */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                className="relative pl-12"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border-subtle" />
                )}

                {/* Number badge */}
                <div className="absolute left-0 top-0">
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full",
                      "bg-bg-surface border-2",
                      "bg-gradient-to-br",
                      step.gradient,
                      "border-border-hover"
                    )}
                  >
                    <span className="text-xl font-bold text-white">
                      {step.step}
                    </span>
                  </div>
                </div>

                {/* Content card */}
                <div className="bg-bg-surface border border-border-subtle rounded-lg p-6">
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4",
                      "bg-gradient-to-br",
                      step.gradient
                    )}
                  >
                    <step.icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold text-text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    {step.description}
                  </p>

                  <CodeBlock code={step.code} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
