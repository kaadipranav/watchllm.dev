"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";

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
    gradient: "from-cyan-500/10 to-blue-500/5",
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
    gradient: "from-violet-500/10 to-purple-500/5",
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
    gradient: "from-amber-500/10 to-orange-500/5",
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
      {/* Popular highlight ring - gradient border */}
      {plan.popular && (
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-violet-500/50 via-violet-500/20 to-transparent" />
      )}

      <div className={cn(
        "relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-300",
        plan.popular
          ? "border-transparent bg-white/[0.04]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]",
        APP_CONFIG.showPricingComingSoon && plan.name !== "Free" && "overflow-hidden"
      )}>
        {/* Coming Soon Overlay */}
        {APP_CONFIG.showPricingComingSoon && plan.name !== "Free" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[hsl(222_47%_4%_/_0.7)] backdrop-blur-[2px]">
            <div className="rounded-full bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-violet-400 ring-1 ring-inset ring-violet-500/30">
              Coming Soon
            </div>
            <p className="mt-2 text-[0.6rem] text-premium-text-muted font-medium uppercase tracking-widest text-center px-4">
              Available after testing
            </p>
          </div>
        )}

        <div className={cn(
          "flex flex-col h-full",
          APP_CONFIG.showPricingComingSoon && plan.name !== "Free" && "filter blur-sm grayscale-[0.3] opacity-40 pointer-events-none select-none"
        )}>
          {/* Gradient overlay on hover */}
          <div className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            plan.gradient
          )} />

          {/* Top shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent rounded-t-2xl" />

          {/* Popular badge */}
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-violet-500/25">
                Most Popular
              </span>
            </div>
          )}

          {/* Plan info */}
          <div className="relative space-y-1 pt-2">
            <h3 className="text-lg font-semibold text-premium-text-primary">
              {plan.name}
            </h3>
            <p className="text-sm text-premium-text-muted">
              {plan.description}
            </p>
          </div>

          {/* Price */}
          <div className="relative mt-6">
            <span className="text-5xl font-bold tabular-nums text-premium-text-primary">
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
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-premium-text-secondary">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="relative mt-6">
            <Button
              asChild
              className={cn(
                "w-full h-11 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
                plan.popular
                  ? "bg-white text-[hsl(222_47%_4%)] hover:bg-white/90"
                  : "border border-white/[0.12] bg-transparent text-premium-text-primary hover:border-white/[0.2] hover:bg-white/[0.05]"
              )}
            >
              <Link href={plan.href}>
                {plan.cta}
              </Link>
            </Button>
          </div>
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
          <p className="text-sm font-medium text-violet-400 mb-4">Pricing</p>
          <h2 className="text-4xl font-bold tracking-tight text-premium-text-primary sm:text-5xl">
            Simple, <span className="text-gradient-accent">transparent</span> pricing
          </h2>
          <p className="mt-6 text-lg text-premium-text-secondary">
            Start free, upgrade when you need more. Predictable pricing with no surprises.
          </p>
        </motion.div>

        {/* Pricing grid */}
        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>

      </div>
    </section>
  );
}
