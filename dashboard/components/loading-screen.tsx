"use client";

import { motion, useReducedMotion } from "framer-motion";

const shimmerVariants = {
  animate: (reduceMotion: boolean) =>
    reduceMotion
      ? { x: "0%" }
      : { x: ["-40%", "40%", "-40%", "40%", "-40%"] },
};

const pulseVariants = {
  animate: (reduceMotion: boolean) =>
    reduceMotion
      ? { opacity: 1 }
      : { opacity: [0.1, 1, 0.1], scale: [1, 1.02, 1] },
};

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
  detail?: string;
};

const placeholderSteps = [
  { label: "Fetching agent run", status: "pending" },
  { label: "Streaming step-by-step trace", status: "pending" },
  { label: "Analyzing costs & flags", status: "pending" },
];

export default function LoadingScreen({
  title = "Loading the experience",
  subtitle = "Syncing with WatchLLM",
  detail = "Routing traffic through Cloudflare edge and Supabase.",
}: LoadingScreenProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.8),_rgba(2,6,23,1))] text-white">
      <div className="relative flex w-full max-w-4xl flex-col gap-8 rounded-[36px] border border-white/10 bg-slate-900/80 p-10 text-left shadow-[0_35px_80px_-45px_rgba(2,6,23,0.9)] backdrop-blur-3xl">
        <motion.div
          className="pointer-events-none absolute -inset-2 rounded-[40px] border border-transparent bg-gradient-to-r from-purple-500/40 via-cyan-400/40 to-blue-500/40 opacity-40 blur-3xl"
          animate={reduceMotion ? { opacity: 0.4 } : { opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative space-y-3">
          <p className="text-xs uppercase tracking-[0.5em] text-white/40">Observability</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
          <p className="text-sm text-white/60">{subtitle}</p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/70 p-5 shadow-inner shadow-black/40">
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/30 via-blue-400/30 to-cyan-400/30 opacity-70"
            custom={reduceMotion}
            variants={shimmerVariants}
            animate="animate"
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-0"
            custom={reduceMotion}
            variants={pulseVariants}
            animate="animate"
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Streaming</p>
            <div className="space-y-3">
              {placeholderSteps.map((entry) => (
                <div key={entry.label} className="flex items-center gap-4">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      entry.status === "pending" ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                  />
                  <div className="flex-1 text-sm text-white/70">{entry.label}</div>
                  <span className="text-[0.65rem] uppercase tracking-[0.3em] text-white/40">{entry.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm text-white/60">
          <p>{detail}</p>
          <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40">
            {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "numeric", second: "numeric" }).format(new Date())}
          </p>
        </div>
      </div>
    </div>
  );
}
