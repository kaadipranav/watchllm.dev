"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    description: "Perfect for side projects",
    price: "$0",
    period: "forever",
    features: [
      "50,000 requests/month",
      "10 requests/minute",
      "Basic semantic caching",
      "7-day usage history",
      "Community support",
      "1 project",
    ],
    cta: "Get Started",
    href: "/signup",
    popular: false,
  },
  {
    name: "Starter",
    description: "For growing applications",
    price: "$29",
    period: "/month",
    features: [
      "250,000 requests/month",
      "50 requests/minute",
      "Advanced semantic caching",
      "30-day usage history",
      "Email support",
      "5 projects",
      "Webhook notifications",
      "Custom cache TTL",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=starter",
    popular: false,
  },
  {
    name: "Pro",
    description: "For production workloads",
    price: "$49",
    period: "/month",
    features: [
      "1,000,000 requests/month",
      "200 requests/minute",
      "Priority semantic caching",
      "90-day usage history",
      "Priority support",
      "Unlimited projects",
      "Webhook notifications",
      "Custom cache TTL",
      "API analytics dashboard",
      "Team members (up to 5)",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    popular: true,
  },
];

function PricingCard({
  plan,
  index
}: {
  plan: typeof plans[0];
  index: number;
}) {
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {/* Popular highlight ring */}
      {plan.popular && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-premium-accent/40 via-premium-accent/20 to-transparent" />
      )}

      {/* Gradient border on hover (non-popular) */}
      {!plan.popular && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      <div className={cn(
        "relative flex h-full flex-col rounded-2xl border p-6",
        plan.popular
          ? "border-premium-accent/30 bg-premium-bg-elevated/80"
          : "border-white/[0.06] bg-premium-bg-elevated/60"
      )}>
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]" />

        {/* Popular badge */}
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full border border-premium-accent/30 bg-premium-bg-elevated px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-premium-accent">
              Most Popular
            </span>
          </div>
        )}

        {/* Plan info */}
        <div className="relative space-y-1">
          <h3 className="text-lg font-semibold text-premium-text-primary">
            {plan.name}
          </h3>
          <p className="text-sm text-premium-text-muted">
            {plan.description}
          </p>
        </div>

        {/* Price */}
        <div className="relative mt-6">
          <span className="text-4xl font-bold tabular-nums text-premium-text-primary">
            {plan.price}
          </span>
          <span className="ml-1 text-sm text-premium-text-muted">
            {plan.period}
          </span>
        </div>

        {/* Features */}
        <ul className="relative mt-6 flex-1 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/80" />
              <span className="text-premium-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="relative mt-6">
          <Button
            asChild
            className={cn(
              "w-full h-11 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98]",
              plan.popular
                ? "bg-premium-accent text-white hover:bg-premium-accent/90"
                : "border border-white/[0.1] bg-white/[0.02] text-premium-text-primary hover:border-white/[0.15] hover:bg-white/[0.04]"
            )}
          >
            <Link href={plan.href}>
              {plan.cta}
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-premium-text-muted">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-premium-text-primary sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-base text-premium-text-secondary">
            Start free, upgrade when you need more. Predictable pricing with no surprises.
          </p>
        </motion.div>

        {/* Pricing grid */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>

        {/* Custom plan CTA */}
        <motion.p
          className="mt-12 text-center text-sm text-premium-text-muted"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Need a custom plan?{" "}
          <Link
            href="mailto:support@watchllm.com"
            className="text-premium-accent hover:text-premium-accent/80 transition-colors duration-100"
          >
            Contact us
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
