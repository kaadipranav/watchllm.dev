"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Code2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { APP_CONFIG } from "@/lib/config";

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
    <span className="font-mono text-3xl font-bold text-text-primary">
      {count.toLocaleString()}
      {suffix && <span className="text-text-secondary">{suffix}</span>}
    </span>
  );
}

/**
 * Live stat ticker component
 */
function LiveStatTicker() {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12"
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
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
        >
          <AnimatedCounter target={stat.value} suffix={stat.suffix} />
          <p className="text-xs uppercase tracking-wider text-text-muted mt-2">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Dashboard preview with 3D effect
 */
function DashboardPreview() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative mt-20 w-full max-w-6xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      style={{ perspective: "1200px" }}
    >
      <motion.div
        className="relative rounded-xl border border-border-hover bg-bg-surface shadow-large overflow-hidden"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(5deg) rotateY(0deg)",
        }}
        animate={
          reduceMotion
            ? {}
            : {
                y: [0, -20, 0],
              }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Ambient light effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        {/* Dashboard content placeholder - replace with actual screenshot */}
        <div className="aspect-video bg-gradient-to-br from-bg-elevated to-bg-primary p-8">
          <div className="h-full w-full rounded-lg border border-border-subtle bg-bg-primary/50 backdrop-blur-sm p-6">
            {/* Dashboard header */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 w-32 bg-text-muted/20 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-text-muted/20 rounded animate-pulse" />
                <div className="h-8 w-24 bg-text-muted/20 rounded animate-pulse" />
              </div>
            </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-bg-elevated rounded-lg p-4 border border-border-subtle">
                  <div className="h-4 w-20 bg-text-muted/20 rounded mb-2 animate-pulse" />
                  <div className="h-8 w-16 bg-text-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
            
            {/* Chart area */}
            <div className="h-48 bg-bg-elevated rounded-lg border border-border-subtle p-4">
              <div className="h-full w-full bg-gradient-to-t from-accent-primary/10 to-transparent rounded" />
            </div>
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-accent-primary/20 to-accent-purple/20 blur-2xl -z-10 opacity-50" />
      </motion.div>
    </motion.div>
  );
}

/**
 * Hero section - Redesigned based on ui.md specification
 */
export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen flex items-center py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent-primary/15 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 hero-grid" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Main content */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Badge variant="primary" className="inline-flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary" />
              </span>
              Live
            </Badge>
          </motion.div>

          {/* Headline with stagger animation */}
          <motion.div className="space-y-4 mb-8">
            <motion.h1
              className="text-6xl sm:text-7xl lg:text-[72px] font-black tracking-tight leading-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <span className="text-gradient">
                Real-time LLM intelligence
              </span>
            </motion.h1>

            <motion.p
              className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Unify AI costs across OpenAI, Claude, and Groq with semantic caching. 
              Drop-in proxy that cuts costs by 70% on repeated API calls.
            </motion.p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Button asChild size="lg" className="min-w-[200px]">
              <Link href="/signup">
                Get Started
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="min-w-[200px]">
              <Link href="#features">
                View Features
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
              <Code2 className="h-4 w-4 text-accent-primary" />
              OpenAI-compatible
            </span>
          </motion.div>

          {/* Live stats ticker */}
          <LiveStatTicker />
        </div>

        {/* Dashboard preview */}
        <DashboardPreview />
      </div>
    </section>
  );
}
