"use client";

import { 
  Zap, 
  Database, 
  Shield, 
  BarChart3, 
  Code, 
  Globe,
  Clock,
  DollarSign 
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Zap,
    title: "Semantic Caching",
    description:
      "Intelligent caching that understands similar queries, not just exact matches. Save up to 70% on repeated API calls.",
  },
  {
    icon: Code,
    title: "Zero Code Changes",
    description:
      "Just change your base URL. Works with any OpenAI-compatible SDK - Python, Node.js, Go, and more.",
  },
  {
    icon: Clock,
    title: "Faster Responses",
    description:
      "Cached responses return in <50ms instead of 500ms+. Better user experience with lower latency.",
  },
  {
    icon: DollarSign,
    title: "Cost Analytics",
    description:
      "Real-time dashboard showing exactly how much you're saving. Track costs by project, model, and more.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Your data never stored on disk. End-to-end encryption. SOC 2 compliant infrastructure.",
  },
  {
    icon: Globe,
    title: "Global Edge Network",
    description:
      "Deployed on Cloudflare's global network. Low latency from anywhere in the world.",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description:
      "Detailed insights into your API usage patterns. Optimize your prompts and reduce costs further.",
  },
  {
    icon: Database,
    title: "Multi-Provider Support",
    description:
      "Route requests to OpenAI, Anthropic, Groq, and more through a single unified API.",
  },
];

/**
 * Feature card with computational glass effect.
 * Directional gradient border, inner shadow, Z-axis hover lift.
 */
function FeatureCard({ 
  feature, 
  index 
}: { 
  feature: typeof features[0]; 
  index: number;
}) {
  const Icon = feature.icon;
  
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
    >
      {/* Gradient border on hover */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative h-full rounded-xl border border-white/[0.06] bg-premium-bg-elevated/60 p-6 transition-transform duration-200 group-hover:-translate-y-0.5">
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]" />
        
        {/* Icon container */}
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Icon className="h-5 w-5 text-premium-accent" />
        </div>
        
        {/* Content */}
        <h3 className="relative mt-4 text-base font-semibold text-premium-text-primary">
          {feature.title}
        </h3>
        <p className="relative mt-2 text-sm leading-relaxed text-premium-text-muted">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="relative py-24"
    >
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-premium-bg-elevated/30 via-transparent to-transparent" />
      </div>

      <div className="relative container mx-auto px-4">
        {/* Section header - tighter typography */}
        <motion.div 
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-premium-text-muted">
            Capabilities
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-premium-text-primary sm:text-4xl">
            Everything you need to cut AI costs
          </h2>
          <p className="mt-4 text-base text-premium-text-secondary">
            Semantic caching, analytics, and enterprise controls. Scale safely, save aggressively.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
