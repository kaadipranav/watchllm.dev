"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, CheckCircle, ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { APP_CONFIG } from "@/lib/config";

/**
 * Metric card with OpenAI-inspired glass effect
 */
function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      className="group relative"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Gradient border effect */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-white/[0.1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 text-center backdrop-blur-sm">
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-premium-text-muted">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-premium-text-primary">
          {value}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Live indicator with controlled pulse animation
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
    accent: "from-violet-500 via-purple-500 to-pink-500",
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
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 backdrop-blur-sm"
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

const typingPhrases = [
  "Semantic caching that thinks like you.",
  "Run GPT-5 with 30-70% lower spend.",
  "Built for teams scaling AI globally.",
];

function useTyping(phrases: string[]) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < current.length) {
        setCharIndex((prev) => prev + 1);
        return;
      }

      if (isDeleting && charIndex > 0) {
        setCharIndex((prev) => prev - 1);
        return;
      }

      if (charIndex === current.length) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }, isDeleting ? 70 : 120);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, phrases]);

  return useMemo(() => phrases[phraseIndex].slice(0, charIndex), [charIndex, phraseIndex, phrases]);
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  const typedText = useTyping(typingPhrases);

  return (
    <section className="relative pt-32 pb-32 sm:pt-40 sm:pb-40">
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-24 px-4 lg:flex-row lg:items-center">
        {/* Left content */}
        <div className="max-w-2xl space-y-12">
          {/* Dovetail-style announcement badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link
              href="#features"
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm font-medium text-premium-text-muted transition-all duration-200 hover:border-white/[0.2] hover:bg-white/[0.05]"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-violet-500" />
              <span>Watch the 2025 launch keynote</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Headline - Dovetail/Raycast style big typography */}
          <motion.div
            className="space-y-8 -mt-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-6xl font-extrabold leading-[1.05] tracking-tight text-premium-text-primary sm:text-7xl lg:text-8xl pr-8">
              <span className="whitespace-nowrap">Real-time LLM</span>
              <br />
              <motion.span
                className="inline-block overflow-visible leading-[1.05] pb-1 bg-gradient-to-r from-purple-400 via-blue-400 via-cyan-400 via-teal-400 via-green-400 via-lime-400 via-yellow-400 via-orange-400 to-purple-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                intelligence
              </motion.span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-premium-text-secondary sm:text-xl">
              Unify AI costs across OpenAI, Claude, and Groq via OpenRouter. Let semantic caching surface the savings that matter.
              <br />
              <span className="text-premium-text-muted mt-2 block">Instantly cut costs by 70%.</span>
            </p>
            <p className="text-xs text-premium-text-muted/60 mt-1 max-w-md italic">
              * Currently optimized for OpenRouter. Use your own keys for access to premium model providers.
            </p>
            <div className="text-sm font-medium text-premium-text-muted">
              <div className="typing-effect text-white/80">
                {typedText}
                <span className="typing-cursor">|</span>
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.3em] text-white/40">
                Series A-ready tooling
              </div>
            </div>
          </motion.div>

          {/* CTAs - OpenAI style with white primary button */}
          <motion.div
            className="flex flex-wrap items-center gap-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Button asChild className="h-12 rounded-full bg-white px-7 text-base font-semibold text-[hsl(222_47%_4%)] transition-all duration-200 hover:bg-white/90 active:scale-[0.98]">
              <Link href="/signup">
                Try WatchLLM free
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-white/[0.12] bg-transparent px-7 text-base font-semibold text-premium-text-primary transition-all duration-200 hover:border-white/[0.2] hover:bg-white/[0.05] active:scale-[0.98]"
            >
              <Link href={`mailto:${APP_CONFIG.salesEmail}`}>
                Contact sales
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators - cleaner inline style */}
          <motion.div
            className="flex flex-wrap items-center gap-8 pt-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="flex items-center gap-2 text-sm text-premium-text-muted">
              <CheckCircle className="h-4 w-4 text-emerald-500/80" />
              No credit card required
            </span>
            <span className="flex items-center gap-2 text-sm text-premium-text-muted">
              <CheckCircle className="h-4 w-4 text-emerald-500/80" />
              OpenAI-compatible API
            </span>
          </motion.div>

          {/* Metrics - tighter grid */}
          <motion.div
            className="grid grid-cols-3 gap-4 pt-8"
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
          {/* Highlight stats moved here - above code panel */}
          <div className="pointer-events-none absolute -top-40 left-0 right-0 hidden w-full flex-col gap-3 lg:flex">
            {highlightStats.map((stat) => (
              <HighlightCard key={stat.label} stat={stat} reduceMotion={Boolean(reduceMotion)} />
            ))}
          </div>

          {/* Card with OpenAI-style glass effect */}
          <div className="relative space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl card-glow mt-40">
            {/* Inner glow at top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <LiveIndicator />
              <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.15em] text-emerald-400">
                99.9% up
              </Badge>
            </div>

            {/* Code block - terminal style */}
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[hsl(222_47%_3%)]">
              {/* Terminal header */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/60" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <span className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <span className="ml-2 text-[0.7rem] font-medium text-premium-text-muted">
                  integration.ts
                </span>
              </div>
              {/* Code content */}
              <pre className="overflow-x-auto px-4 py-5 text-[13px] leading-relaxed">
                <code className="text-premium-text-secondary">
                  <span className="text-violet-400">const</span>{" "}
                  <span className="text-premium-text-primary">client</span>{" "}
                  <span className="text-violet-400">=</span>{" "}
                  <span className="text-violet-400">new</span>{" "}
                  <span className="text-cyan-400">WatchLLM</span>
                  {"({\n"}
                  {"  "}
                  <span className="text-premium-text-muted">apiKey</span>
                  {": "}
                  <span className="text-emerald-400">process.env.WATCHLLM_KEY</span>
                  {",\n"}
                  {"  "}
                  <span className="text-premium-text-muted">baseURL</span>
                  {": "}
                  <span className="text-amber-400">&quot;{APP_CONFIG.workerUrl}/v1&quot;</span>
                  {",\n"}
                  {"});"}
                </code>
              </pre>
            </div>

            {/* Footer bar */}
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-premium-text-muted">
              <span>Global semantic cache</span>
              <span className="text-premium-text-secondary">OpenAI / Claude / Groq</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
