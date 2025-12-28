"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Code2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
 * Live stat ticker component
 */
function LiveStatTicker() {
  return (
    <motion.div
      className="inline-grid grid-cols-1 sm:grid-cols-3 gap-12 px-12 py-8 rounded-2xl border border-border-subtle bg-bg-surface/30 backdrop-blur-sm mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      {[
        { label: "Requests/s", value: 1200, suffix: "/s" },
        { label: "Cache Hit Rate", value: 78, suffix: "%" },
        { label: "Cost Savings", value: 70, suffix: "%" },
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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseenter", handleMouseEnter);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseenter", handleMouseEnter);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500"
      style={{
        opacity,
        background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.06), transparent 80%)`,
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
    <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-primary via-accent-purple to-accent-primary bg-[length:200%_auto] animate-flow-wave">
      {words[index].substring(0, subIndex)}
      <span className="inline-block w-[2px] h-[0.8em] bg-accent-primary ml-1 align-middle animate-pulse" />
    </span>
  );
}

/**
 * Hero section - Redesigned based on ui.md specification
 */
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center py-20 overflow-hidden">
      <Spotlight />
      {/* Spotlight effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-[96rem] px-2 sm:px-8 lg:px-16 w-full z-10">
        {/* Main content */}
        <div className="text-center max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <Badge variant="secondary" className="inline-flex items-center gap-3 text-xs py-1.5 px-4 border-border-subtle bg-bg-surface/40 backdrop-blur-md rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
              </span>
              <span className="text-text-secondary font-semibold tracking-[0.1em] uppercase text-[10px]">System Operational</span>
            </Badge>
          </motion.div>

          {/* Headline with stagger animation */}
          <motion.div className="space-y-6 mb-10">
            <motion.h1
              className="hero-heading text-6xl sm:text-8xl lg:text-[104px] tracking-[-0.04em] leading-[0.95] text-text-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              The builder&rsquo;s companion for <Typewriter words={["OpenAI", "Claude", "Groq", "Llama 3"]} /> caching
            </motion.h1>

            <motion.p
              className="text-xl sm:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Ship confidently with semantic caching for <span className="font-semibold text-text-primary">OpenAI, Claude, Groq, Llama 3</span>—keep your integrations identical to day one while serving repeated prompts under 100ms.
            </motion.p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button asChild size="lg" className="h-14 px-10 text-lg min-w-[220px] relative overflow-hidden group">
              <Link href="/signup">
                <span className="relative z-10">Launch Build</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-14 px-10 text-lg min-w-[220px] border-border-default hover:bg-bg-elevated transition-all">
              <Link href="#features">
                See the stack
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent-success" />
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-text-muted" />
              OpenAI-compatible
            </span>
          </motion.div>

          {/* Live stats ticker */}
          <LiveStatTicker />
        </div>

      </div>
    </section>
  );
}
