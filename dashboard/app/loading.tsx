"use client";

import { motion, useReducedMotion } from "framer-motion";

const progressVariants = {
  animate: (reduceMotion: boolean) =>
    reduceMotion
      ? { width: "100%" }
      : { width: ["0%", "75%", "35%", "100%"] },
};

export default function LoadingScreen() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[hsl(220_13%_8%)] text-center text-white/70">
      <div className="space-y-1">
        <p className="text-[0.6rem] uppercase tracking-[0.4em] text-white/40">
          syncing with the edge proxy...
        </p>
        <p className="text-sm font-semibold text-white">Loading WatchLLM</p>
      </div>
      <div className="w-72">
        <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-premium-accent to-blue-400"
            custom={reduceMotion}
            variants={progressVariants}
            animate="animate"
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/40">
        routing requests through Cloudflare edge
      </p>
    </div>
  );
}
