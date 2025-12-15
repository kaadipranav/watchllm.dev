"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, CheckCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Ambient background - Static version for better performance
 * Replaces the framer-motion heavy version.
 */
function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.06),transparent)]" />

      {/* Static gradient orbs - much lighter than animating them */}
      <div className="absolute -left-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,transparent_70%)] blur-[80px]" />
      <div className="absolute right-[-5%] top-[5%] h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_70%)] blur-[80px]" />

      {/* Bottom fade to primary background */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-premium-bg-primary to-transparent" />

      {/* Subtle noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

/**
 * Metric card with computational glass effect.
 * Directional gradient border, inner shadow, subtle hover lift.
 */
function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      className="group relative"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Gradient border effect */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative rounded-xl border border-white/[0.06] bg-premium-bg-elevated/80 px-5 py-4 text-center backdrop-blur-sm">
        {/* Inner shadow for depth */}
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]" />

        <p className="relative text-[0.6rem] font-medium uppercase tracking-[0.2em] text-premium-text-muted">
          {label}
        </p>
        <p className="relative mt-1 text-2xl font-semibold tabular-nums text-premium-text-primary">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Live indicator with controlled pulse animation.
 */
function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-premium-text-muted">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Live Edge
    </div>
  );
}

const highlightStats = [
  {
    label: "Cache hit",
    valueText: "78%",
    width: 78,
    accent: "from-emerald-400 via-cyan-400 to-blue-500",
    delay: 0,
  },
  {
    label: "Requests/s",
    valueText: "1.2K",
    width: 68,
    accent: "from-purple-500 via-blue-500 to-cyan-400",
    delay: 0.08,
  },
  {
    label: "Savings",
    valueText: "$34K",
    width: 82,
    accent: "from-amber-400 via-orange-400 to-red-500",
    delay: 0.16,
  },
];

function HighlightCard({
  stat,
  reduceMotion,
}: {
  stat: (typeof highlightStats)[0];
  reduceMotion: boolean;
}) {
  const width = `${stat.width}%`;

  return (
    <motion.div
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3"

      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: stat.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <p className="text-[0.55rem] font-medium uppercase tracking-[0.2em] text-white/50">
        {stat.label}
      </p>
      <div className="mt-2 flex items-center justify-between text-base font-semibold text-white">
        <span>{stat.valueText}</span>
        <span className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-white/40">Live</span>
      </div>
      <div className="mt-3 h-1 rounded-full bg-white/[0.08]">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${stat.accent}`}
          animate={
            reduceMotion
              ? { width }
              : { width: ["40%", width, "58%", width] }
          }
          transition={{
            duration: 2.4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </div>
    </motion.div>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="relative overflow-hidden pt-24 pb-24 sm:pt-28 sm:pb-28">
      {/* Ambient background is now global in page.tsx, we can keep subtle overlay here or remove */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-premium-bg-primary/50" />
      <div className="pointer-events-none absolute top-12 right-6 hidden w-72 flex-col gap-3 lg:flex">
        {highlightStats.map((stat) => (
          <HighlightCard key={stat.label} stat={stat} reduceMotion={Boolean(reduceMotion)} />
        ))}
      </div>


      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 lg:flex-row lg:items-center">
        {/* Left content */}
        <div className="max-w-2xl space-y-8">
          {/* Badge - quieter, more technical */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-premium-text-muted">
              <Zap className="h-3.5 w-3.5 text-premium-accent" />
              One URL swap → 70% savings
            </div>
          </motion.div>

          {/* Headline - tighter, more confident */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-premium-text-primary sm:text-5xl lg:text-[3.25rem]">
              Cut LLM costs by 70%.{" "}
              <span className="text-premium-text-secondary">
                Keep responses instant.
              </span>
            </h1>
            <p className="text-base leading-relaxed text-premium-text-secondary sm:text-lg">
              Drop-in proxy for OpenAI, Claude, and Groq with global semantic caching.
              Sub-50ms cache hits, enterprise security, zero refactors.
            </p>
          </motion.div>

          {/* CTAs - heavier, stable buttons */}
          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Button asChild className="relative h-11 rounded-lg bg-premium-accent px-6 text-sm font-semibold text-white transition-all duration-150 hover:bg-premium-accent/90 active:scale-[0.98] active:bg-premium-accent/80">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-lg border-white/[0.1] bg-white/[0.02] px-6 text-sm font-semibold text-premium-text-primary transition-all duration-150 hover:border-white/[0.15] hover:bg-white/[0.04] active:scale-[0.98]"
            >
              <Link href="#pricing">
                View Pricing
              </Link>
            </Button>

            {/* Trust indicators - inline, quieter */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-premium-text-muted">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500/80" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500/80" />
                OpenAI-compatible
              </span>
            </div>
          </motion.div>

          {/* Metrics - tighter grid */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <MetricCard label="Free Requests" value="50K" />
            <MetricCard label="Latency" value="<50ms" />
            <MetricCard label="Uptime" value="99.9%" />
          </motion.div>
        </div>

        {/* Right side - Code preview panel */}
        <motion.div
          className="relative w-full max-w-xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Card with computational glass effect */}
          <div className="relative space-y-4 rounded-2xl border border-white/[0.06] bg-premium-bg-elevated/60 p-5 backdrop-blur-xl">
            {/* Inner glow at top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <LiveIndicator />
              <Badge className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.15em] text-premium-text-muted">
                99.9% up
              </Badge>
            </div>

            {/* Code block - terminal style */}
            <div className="overflow-hidden rounded-lg border border-white/[0.06] bg-premium-bg-primary/90">
              {/* Terminal header */}
              <div className="flex items-center gap-2 border-b border-white/[0.04] px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                </div>
                <span className="text-[0.65rem] font-medium uppercase tracking-[0.15em] text-premium-text-muted">
                  integration.ts
                </span>
              </div>
              {/* Code content */}
              <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed">
                <code className="text-premium-text-secondary">
                  <span className="text-purple-400">const</span>{" "}
                  <span className="text-premium-text-primary">client</span>{" "}
                  <span className="text-purple-400">=</span>{" "}
                  <span className="text-purple-400">new</span>{" "}
                  <span className="text-blue-400">WatchLLM</span>
                  {"({\n"}
                  {"  "}
                  <span className="text-premium-text-muted">apiKey</span>
                  {": "}
                  <span className="text-emerald-400">process.env.WATCHLLM_KEY</span>
                  {",\n"}
                  {"  "}
                  <span className="text-premium-text-muted">baseURL</span>
                  {": "}
                  <span className="text-amber-400">&quot;https://proxy.watchllm.dev/v1&quot;</span>
                  {",\n"}
                  {"});"}
                </code>
              </pre>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Cache hit", value: "68%" },
                { label: "Regions", value: "240+" },
                { label: "Avg RT", value: "47ms" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-white/[0.04] bg-premium-bg-primary/60 px-3 py-2.5 text-center"
                >
                  <p className="text-[0.55rem] font-medium uppercase tracking-[0.15em] text-premium-text-muted">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-premium-text-primary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer bar */}
            <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-premium-bg-primary/40 px-4 py-2.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-premium-text-muted">
              <span>Global semantic cache</span>
              <span>OpenAI / Claude / Groq</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
