"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Animated counter for live stats
 */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="hero-heading text-4xl font-bold text-text-primary tracking-tight">
      {count.toLocaleString()}
      {suffix && <span className="text-text-secondary ml-1">{suffix}</span>}
    </span>
  );
}

/**
 * Savings-focused stat ticker component
 */
function SavingsStatTicker() {
  return (
    <motion.div
      className="inline-grid grid-cols-1 sm:grid-cols-3 gap-12 px-12 py-8 rounded-2xl border border-green-500/20 bg-green-500/5 backdrop-blur-sm mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      {[
        { label: "Avg. Savings", value: 47, suffix: "%" },
        { label: "Cache Hit Speed", value: 50, suffix: "ms" },
        { label: "Setup Time", value: 5, suffix: "min" },
      ].map((stat, index) => (
        <motion.div
          key={stat.label}
          className="flex flex-col items-center text-center min-w-[140px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
        >
          <AnimatedCounter target={stat.value} suffix={stat.suffix} />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mt-3">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Spotlight effect that follows the mouse
 */
function Spotlight() {
  const [opacity, setOpacity] = useState(0);

  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Ensure the effect is visible immediately on load (some browsers won't fire
    // mouseenter if the pointer is already inside the viewport).
    const initialX = window.innerWidth / 2;
    const initialY = window.innerHeight / 3;
    targetRef.current = { x: initialX, y: initialY };
    currentRef.current = { x: initialX, y: initialY };
    setOpacity(1);

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };

      // If the user starts moving without triggering mouseenter, show it.
      setOpacity(1);

      // In reduced motion mode, follow instantly.
      if (reduceMotionRef.current) {
        currentRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.body.addEventListener("mouseenter", handleMouseEnter);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    const tick = () => {
      const el = spotlightRef.current;
      if (el) {
        const ease = reduceMotionRef.current ? 1 : 0.085; // lower = more lag
        const { x: tx, y: ty } = targetRef.current;
        const cx = currentRef.current.x + (tx - currentRef.current.x) * ease;
        const cy = currentRef.current.y + (ty - currentRef.current.y) * ease;
        currentRef.current = { x: cx, y: cy };

        // Neutral grey glow (brighter/more noticeable), with a soft outer halo.
        el.style.background = `radial-gradient(520px circle at ${cx}px ${cy}px, rgba(245, 245, 245, 0.10), transparent 60%), radial-gradient(820px circle at ${cx}px ${cy}px, rgba(180, 180, 180, 0.06), transparent 72%)`;
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseenter", handleMouseEnter);
      document.body.removeEventListener("mouseleave", handleMouseLeave);

      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={spotlightRef}
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500 mix-blend-screen"
      style={{
        opacity,
        // Background is driven by rAF for smooth lag.
        background:
          "radial-gradient(520px circle at 0px 0px, rgba(245, 245, 245, 0.10), transparent 60%), radial-gradient(820px circle at 0px 0px, rgba(180, 180, 180, 0.06), transparent 72%)",
      }}
    />
  );
}

/**
 * Typewriter effect for hero headline
 */
function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  return (
    <span className="inline text-text-primary">
      {words[index].substring(0, subIndex)}
      <span className="inline-block w-[3px] h-[0.75em] bg-white/50 ml-1 align-middle animate-pulse rounded-full" />
    </span>
  );
}

/**
 * Hero section - Redesigned based on ui.md specification
 */
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden">
      <Spotlight />
      {/* Spotlight effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-white/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full z-10 flex justify-center">
        {/* Main content */}
        <div className="text-center max-w-6xl w-full px-4 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10 flex items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.4em] text-text-muted"
          >
            <span className="hidden sm:inline-block h-px w-10 bg-white/20" aria-hidden="true" />
            <span>Stop overpaying for repeated AI requests</span>
            <span className="hidden sm:inline-block h-px w-10 bg-white/20" aria-hidden="true" />
          </motion.div>

          {/* Headline with stagger animation */}
          <motion.div className="space-y-6 mb-10">
            <motion.h1
              className="hero-heading text-5xl sm:text-7xl lg:text-[84px] tracking-[-0.04em] leading-[1.05] text-text-primary mb-8 px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="block">Your OpenAI bill is probably</span>
              <span className="block mt-3">
                <Typewriter words={["40% waste", "too high", "fixable"]} />
              </span>
            </motion.h1>

            <motion.div
              className="max-w-2xl mx-auto px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-lg sm:text-xl text-text-secondary font-medium leading-relaxed text-center">
                <div>WatchLLM caches similar API requests so you never pay twice for the same answer.</div>
                <div className="mt-2 text-green-400">See your savings in real-time. Setup takes 5 minutes.</div>
              </div>
            </motion.div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-lg min-w-[220px] relative overflow-hidden group shadow-lg shadow-green-500/10 bg-green-500 text-white hover:bg-green-400"
            >
              <Link href="/signup">
                <span className="relative z-10 font-semibold">Start Saving — Free</span>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 px-10 text-lg min-w-[220px] border-2 border-text-secondary/30 hover:border-white/50 hover:bg-white/5 text-text-primary transition-all"
            >
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <span className="flex items-center gap-2">No credit card required</span>
            <span className="flex items-center gap-2">Works with OpenAI, Anthropic, Groq</span>
            <span className="flex items-center gap-2">Change 1 line of code</span>
          </motion.div>

          {/* Savings stats ticker */}
          <SavingsStatTicker />
        </div>
      </div>
    </section>
  );
}
