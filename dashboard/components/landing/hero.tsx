"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Activity, ShieldCheck } from "lucide-react";
import { animate, motion, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogoBeams } from "@/components/landing/logo-beams";

function useOneShotTyping(text: string, durationMs: number) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(reduced ? text.length : 0);

  useEffect(() => {
    if (reduced) return;
    const stepMs = Math.max(14, Math.floor(durationMs / Math.max(1, text.length)));
    const id = window.setInterval(() => {
      setCount((prev) => {
        if (prev >= text.length) {
          window.clearInterval(id);
          return prev;
        }

        return prev + 1;
      });
    }, stepMs);

    return () => window.clearInterval(id);
  }, [durationMs, reduced, text.length]);

  return useMemo(() => text.slice(0, count), [count, text]);
}

function formatMoney(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function LiveCostTicker() {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(1284.32);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setValue((v) => {
        const drift = (Math.random() - 0.35) * 2.4;
        const next = Math.max(0, v + drift);
        return Math.round(next * 100) / 100;
      });
    }, 650);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div className="flex items-baseline justify-between">
      <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/40">
        live spend
      </div>
      <div className="text-lg font-semibold tabular-nums text-white/90">
        ${formatMoney(value)}
        <span className="ml-1 text-xs font-medium text-white/40">/day</span>
      </div>
    </div>
  );
}

function LivePulse() {
  const reduced = useReducedMotion();
  return (
    <span className="relative flex h-2 w-2">
      {!reduced && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00F5D4]/30" />
      )}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00F5D4]" />
    </span>
  );
}

function DashboardPanel() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <motion.div
      ref={ref}
      initial={reduced ? undefined : { opacity: 0, y: 14 }}
      animate={inView && !reduced ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="absolute -inset-6 -z-10 rounded-3xl bg-black/40 blur-2xl" />
      <div className="rounded-2xl border border-white/5 bg-[#0F0F0F]/85 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <LivePulse />
            Command Center
          </div>
          <div className="rounded-full border border-white/5 bg-black/30 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            edge
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <LiveCostTicker />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <CountUp label="Cache hit" value={78} suffix="%" />
              <CountUp label="Saved" value={34} prefix="$" suffix="K" />
              <CountUp label="Latency" value={48} suffix="ms" />
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/40">
                recent requests
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <ShieldCheck className="h-4 w-4 text-white/40" />
                audited
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {[
                { provider: "OpenAI", model: "gpt-4.1", cached: true, ms: 42 },
                { provider: "Claude", model: "sonnet", cached: false, ms: 96 },
                { provider: "Groq", model: "llama", cached: true, ms: 39 },
              ].map((row) => (
                <div
                  key={`${row.provider}-${row.model}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white/80">
                      {row.provider}
                      <span className="text-white/35"> / </span>
                      <span className="text-white/55">{row.model}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
                      {row.cached ? "cache hit" : "cache miss"}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <div
                      className={
                        row.cached
                          ? "rounded-md border border-[#00F5D4]/20 bg-[#00F5D4]/10 px-2 py-1 text-[11px] font-medium text-[#00F5D4]"
                          : "rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-white/55"
                      }
                    >
                      {row.cached ? "cached" : "live"}
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-white/80">
                      {row.ms}
                      <span className="ml-0.5 text-xs font-medium text-white/40">ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/40">
                proxy integration
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Activity className="h-4 w-4 text-white/40" />
                headers
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-white/5 bg-black px-4 py-4">
              <pre className="overflow-x-auto text-[13px] leading-relaxed">
                <code className="font-mono text-white/80">
                  <span className="text-white/70">const</span> client <span className="text-white/70">=</span> <span className="text-[#00F5D4]">new</span> WatchLLM({"\n"}
                  {"  "}apiKey: <span className="text-[#9D4EDD]">process.env.WATCHLLM_KEY</span>,{"\n"}
                  {"  "}baseURL: <span className="text-[#9D4EDD]">&quot;https://proxy.watchllm.dev/v1&quot;</span>,{"\n"}
                  {"  "}headers: {"{"}<span className="text-[#9D4EDD]">\"x-watchllm-cache\"</span>: <span className="text-[#00F5D4]">\"semantic\"</span>{"}"},{"\n"}
                  {"}"});
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CountUp({
  label,
  suffix,
  prefix,
  value,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(reduced ? value : 0);
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, mv, reduced, value]);

  return (
    <div ref={ref} className="rounded-lg border border-white/5 bg-black/0 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white/90 tabular-nums">
        {prefix}
        {display}
        {suffix}
      </p>
    </div>
  );
}

export function Hero() {
  const typed = useOneShotTyping("New: unified cost intelligence →", 2000);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  } as const;

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black" />
      <LogoBeams />
      <div className="pointer-events-none absolute inset-0 -z-10 grain-overlay" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_680px_at_50%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/0 via-black/0 to-black" />

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-4 pt-20 pb-16 lg:grid-cols-2 lg:gap-16 lg:pt-24">
        <div className="max-w-xl">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/watchllm_logo.png"
                alt="WatchLLM"
                width={28}
                height={28}
                className="h-7 w-7 brightness-110 drop-shadow-[0_0_22px_rgba(0,245,212,0.18)]"
                priority
              />
              <span className="text-sm font-semibold tracking-tight text-white/85">WatchLLM</span>
            </Link>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-md">
              <LivePulse />
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-white/55">live</span>
            </div>
            <div className="text-sm font-medium text-[#9D4EDD]">{typed}</div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.08 }}
            className="mt-6 font-display text-[clamp(2.6rem,4.8vw,5.3rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-white"
          >
            Real-time API cost
            <br />
            <span className="text-[#00F5D4]">intelligence</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.18 }}
            className="mt-5 text-[18px] leading-relaxed text-white/60"
          >
            WatchLLM monitors every request, surfaces spend in real time, and cuts costs through semantic caching —
            built for engineering leads and FinOps.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.28 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              asChild
              className="h-12 rounded-xl bg-white px-5 text-[15px] font-medium text-black transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_18px_60px_-28px_rgba(255,255,255,0.35)] active:scale-[0.98]"
            >
              <Link href="/signup" aria-label="Try WatchLLM free">
                <span className="mr-2">▶</span>
                Try free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-xl border-white/10 bg-transparent px-5 text-[15px] font-medium text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:border-white/20 hover:bg-white/[0.03] active:scale-[0.98]"
            >
              <Link href="mailto:sales@watchllm.com" aria-label="Contact sales">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact sales
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.34 }}
            className="mt-8 flex flex-wrap items-center gap-5 text-sm text-white/45"
          >
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-white/30" />
              OpenAI / Claude / Groq
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-white/30" />
              cache hit-rate + savings
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-white/30" />
              drop-in proxy
            </span>
          </motion.div>
        </div>

        <DashboardPanel />
      </div>
    </section>
  );
}
