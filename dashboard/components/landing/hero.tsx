"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Dovetail-inspired Hero Section
 * Clean, sophisticated, minimalist design with excellent typography
 */
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Sophisticated grid background */}
      <div className="absolute inset-0 bg-[hsl(222_47%_4%)]">
        <div className="absolute inset-0 grid-pattern opacity-60" />
        
        {/* Subtle gradient overlays */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,hsl(25_95%_60%_/_0.02)_0%,transparent_70%)] blur-[100px]" />
        <div className="absolute top-[20%] right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,hsl(258_90%_66%_/_0.02)_0%,transparent_70%)] blur-[80px]" />
        
        {/* Dovetail-style geometric connections */}
        <svg className="absolute top-[15%] right-[10%] w-[400px] h-[300px] opacity-20" viewBox="0 0 400 300">
          <path d="M50 50 L150 100 L250 80 L200 150 L300 200" stroke="hsl(25 95% 60% / 0.4)" strokeWidth="1" fill="none" />
          <path d="M100 150 L200 200" stroke="hsl(258 90% 66% / 0.3)" strokeWidth="1" fill="none" />
          <circle cx="50" cy="50" r="3" fill="hsl(25 95% 60% / 0.5)" />
          <circle cx="150" cy="100" r="2" fill="white" fillOpacity="0.3" />
          <circle cx="250" cy="80" r="3" fill="hsl(25 95% 60% / 0.5)" />
          <circle cx="200" cy="150" r="2" fill="white" fillOpacity="0.2" />
          <circle cx="300" cy="200" r="3" fill="hsl(258 90% 66% / 0.4)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        {/* Announcement banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm"
        >
          <Play className="w-3 h-3 text-[hsl(var(--accent-orange))]" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
            WATCH THE WINTER LAUNCH 2025 KEYNOTE
          </span>
          <ArrowRight className="w-3 h-3 text-white/40" />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight mb-6"
        >
          Real-time API
          <br />
          <span className="text-gradient-accent">cost intelligence</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-12"
        >
          Unify AI costs across OpenAI, Claude, and Groq with semantic caching. 
          Let AI surface the signals that matter. Instantly create evidence-backed 
          savings, optimize requests, and reduce costs by 70%.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/signup">
            <Button className="btn-primary-premium px-8 py-4 text-lg rounded-full">
              Try WatchLLM free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          
          <Link href="/contact">
            <Button className="btn-secondary-premium px-8 py-4 text-lg rounded-full">
              Contact sales
            </Button>
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-sm text-white/40"
        >
          <p>Trusted by teams at</p>
        </motion.div>
      </div>
    </section>
  );
}
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
    <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28">
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
      {/* Highlight stats on the right - desktop only */}
      <div className="pointer-events-none absolute top-16 right-6 hidden w-72 flex-col gap-3 lg:flex">
        {highlightStats.map((stat) => (
          <HighlightCard key={stat.label} stat={stat} reduceMotion={Boolean(reduceMotion)} />
        ))}
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-4 lg:flex-row lg:items-center">
        {/* Left content */}
        <div className="max-w-2xl space-y-8">
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
            className="space-y-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-premium-text-primary sm:text-6xl lg:text-7xl">
              Real-time LLM
              <br />
              <span className="text-gradient-accent">intelligence</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-premium-text-secondary sm:text-xl">
              Unify AI costs across OpenAI, Claude, and Groq. Let semantic caching surface the savings that matter.
              <span className="text-premium-text-muted"> Instantly cut costs by 70%.</span>
            </p>
            <div className="text-sm font-medium text-premium-text-muted">
              <span className="typing-effect text-white/80">
                {typedText}
                <span className="typing-cursor">|</span>
              </span>
              <span className="ml-2 text-xs uppercase tracking-[0.3em] text-white/40">
                Series A-ready tooling
              </span>
            </div>
          </motion.div>

          {/* CTAs - OpenAI style with white primary button */}
          <motion.div
            className="flex flex-wrap items-center gap-4"
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
              <Link href="mailto:sales@watchllm.com">
                Contact sales
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators - cleaner inline style */}
          <motion.div
            className="flex flex-wrap items-center gap-6 pt-2"
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
            className="grid grid-cols-3 gap-3 pt-4"
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
          {/* Card with OpenAI-style glass effect */}
          <div className="relative space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl card-glow">
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
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center"
                >
                  <p className="text-[0.55rem] font-medium uppercase tracking-[0.15em] text-premium-text-muted">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-premium-text-primary">
                    {item.value}
                  </p>
                </div>
              ))}
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
