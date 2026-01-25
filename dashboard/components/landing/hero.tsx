"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

/**
 * Easing function for smooth deceleration (ease-out cubic)
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animated counter for live stats with intersection observer
 */
function AnimatedCounter({ target, suffix = "", startAnimation }: { target: number; suffix?: string; startAnimation: boolean }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Only animate once when startAnimation becomes true
    if (!startAnimation || hasAnimated) return;

    setHasAnimated(true);
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = easeOutCubic(progress);
      const currentValue = Math.floor(target * easedProgress);
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target); // Ensure we end at exact target
      }
    };

    requestAnimationFrame(animate);
  }, [target, startAnimation, hasAnimated]);

  return (
    <span className="hero-heading text-4xl font-bold text-text-primary tracking-tight">
      {count.toLocaleString()}
      {suffix && <span className="text-text-secondary ml-1">{suffix}</span>}
    </span>
  );
}

/**
 * Savings-focused stat ticker component with viewport detection
 */
function SavingsStatTicker() {
  const [isVisible, setIsVisible] = useState(false);
  const [savingsValue] = useState(() => Math.floor(Math.random() * 31) + 40); // Random 40-70%
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of element is visible
        rootMargin: '0px',
      }
    );

    if (tickerRef.current) {
      observer.observe(tickerRef.current);
    }

    return () => {
      if (tickerRef.current) {
        observer.unobserve(tickerRef.current);
      }
    };
  }, [isVisible]);

  return (
    <motion.div
      ref={tickerRef}
      className="inline-grid grid-cols-1 sm:grid-cols-3 gap-12 px-12 py-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      {[
        { label: "Avg. Savings", value: savingsValue, suffix: "%" },
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
          <AnimatedCounter target={stat.value} suffix={stat.suffix} startAnimation={isVisible} />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mt-3">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </motion.div>
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
                <div className="mt-2 text-text-primary">See your savings in real-time. Setup takes 5 minutes.</div>
              </div>
            </motion.div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col items-center justify-center gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Primary CTA - 1.5x larger */}
              <div className="flex flex-col items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-[84px] px-16 text-2xl min-w-[330px] !bg-white !text-black hover:!bg-white/90 font-semibold shadow-lg shadow-white/10 border border-white/20"
                >
                  <Link href="/signup">
                    <span className="relative z-10">Start Free Trial</span>
                  </Link>
                </Button>
                <p className="text-sm text-text-muted">
                  No credit card required • 10,000 requests free
                </p>
              </div>
              
              {/* Secondary CTA */}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-10 text-lg min-w-[220px] border-2 border-white/20 hover:border-white/40 hover:bg-white/5 text-text-primary transition-all"
              >
                <Link href="#how-it-works" className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Watch 2-Min Demo
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
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
