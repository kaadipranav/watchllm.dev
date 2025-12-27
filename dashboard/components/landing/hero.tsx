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

function HeroMedia() {
  const [videoReady, setVideoReady] = useState(false);

  return (
    <div className="relative mt-16 w-full max-w-5xl mx-auto rounded-2xl border border-border-subtle bg-bg-surface/60 shadow-xl overflow-hidden">
      <video
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/illustrations/experimental-user-interface-in-website-design.svg"
        onCanPlay={() => setVideoReady(true)}
      >
        <source src="/illustrations/hero-image.webm" type="video/webm" />
      </video>
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      >
        <Image
          src="/illustrations/experimental-user-interface-in-website-design.svg"
          alt="WatchLLM hero preview"
          fill
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}

/**
 * Hero section - Redesigned based on ui.md specification
 */
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center py-20 overflow-hidden">
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
            <Badge variant="secondary" className="inline-flex items-center gap-2 text-xs">
              <span className="inline-flex h-2 w-2 rounded-full bg-text-muted" />
              Live
            </Badge>
          </motion.div>

          {/* Headline with stagger animation */}
          <motion.div className="space-y-4 mb-8">
            <motion.h1
              className="hero-heading text-5xl sm:text-6xl lg:text-[64px] tracking-tight leading-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              The builder&rsquo;s companion for real-time semantic caching
            </motion.h1>

            <motion.p
              className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Ship confidently with semantic caching that keeps your OpenAI, Claude, and Groq
              integrations identical to day one while serving repeated prompts under 100ms.
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
                Launch Build
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="min-w-[200px]">
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

          <HeroMedia />
      </div>
    </section>
  );
}
