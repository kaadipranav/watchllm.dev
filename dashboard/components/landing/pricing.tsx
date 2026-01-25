"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";

const plans = [
  {
    name: "Free",
    description: "For side projects",
    price: "$0",
    period: "forever",
    features: [
      { text: "10,000 requests/month", included: true },
      { text: "10 requests/minute", included: true },
      { text: "Basic semantic caching", included: true },
      { text: "7-day usage history", included: true },
      { text: "1 project", included: true },
    ],
    cta: "Get Started",
    href: "/signup",
    popular: false,
  },
  {
    name: "Starter",
    description: "For growing applications",
    price: "$49",
    period: "/month",
    features: [
      { text: "100,000 requests/month", included: true },
      { text: "50 requests/minute", included: true },
      { text: "Advanced semantic caching", included: true },
      { text: "30-day usage history", included: true },
      { text: "Email support", included: true },
    ],
    cta: "Start 14-Day Trial",
    href: "/signup?plan=starter",
    popular: true,
  },
  {
    name: "Pro",
    description: "For production workloads",
    price: "$99",
    period: "/month",
    features: [
      { text: "250,000 requests/month", included: true },
      { text: "Unlimited requests/minute", included: true },
      { text: "Priority semantic caching", included: true },
      { text: "90-day usage history", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Get Started",
    href: "/signup?plan=pro",
    popular: false,
  },
  {
    name: "Agency",
    description: "For high volume",
    price: "Custom",
    period: "",
    features: [
      { text: "10M+ requests/month", included: true },
      { text: "Custom rate limits", included: true },
      { text: "Dedicated infrastructure", included: true },
      { text: "Custom retention", included: true },
      { text: "SLA", included: true },
    ],
    cta: "Contact Sales",
    href: `mailto:${APP_CONFIG.salesEmail}`,
    popular: false,
  },
];

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof plans)[0];
  index: number;
}) {
  const isPopular = plan.popular;
  const [showAnnual, setShowAnnual] = React.useState(false);

  // Calculate annual pricing (20% discount)
  const getAnnualPrice = () => {
    if (plan.name === "Starter") return "$470";
    if (plan.name === "Pro") return "$950";
    return null;
  };

  const annualPrice = getAnnualPrice();

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut" as const,
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <Badge variant="secondary" className="text-xs px-3 py-1 bg-white text-black border-none">
            Most Popular
          </Badge>
        </div>
      )}

      {/* Card */}
      <div
        className={cn(
          "relative h-full bg-bg-surface border rounded-lg p-8",
          "transition-colors duration-base",
          isPopular
            ? "border-white/20"
            : "border-border-subtle hover:border-border-default"
        )}
      >
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-text-secondary mb-2">
              {plan.name}
            </h3>
            <p className="text-sm text-text-muted">{plan.description}</p>
          </div>

          {/* Price */}
          <div>
            {annualPrice && (
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setShowAnnual(!showAnnual)}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors underline"
                >
                  {showAnnual ? "Show monthly" : "Show annual"}
                </button>
                {!showAnnual && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20">
                    💰 Save 20% annual
                  </Badge>
                )}
              </div>
            )}
            <div className="flex items-baseline">
              <span className="text-5xl font-semibold font-mono text-text-primary">
                {showAnnual && annualPrice ? annualPrice : plan.price}
              </span>
              <span className="ml-2 text-sm text-text-muted">
                {showAnnual && annualPrice ? "/year" : plan.period}
              </span>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-3 flex-1">
            {plan.features.map((feature, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-3 text-sm",
                  !feature.included && "text-text-muted opacity-50"
                )}
              >
                <span className="text-text-secondary">•</span>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="pt-6">
            <Button
              asChild
              variant={isPopular ? "default" : "secondary"}
              className={cn(
                "w-full",
                isPopular ? "bg-white text-black hover:bg-white/90" : ""
              )}
              size="lg"
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </div>

          {/* Overage Pricing */}
          <div className="pt-4 border-t border-border-subtle">
            <p className="text-xs font-medium text-text-muted mb-2">Exceeded your limit? No problem:</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              {plan.name === "Free" && "Cache-only mode after 10k requests (no additional charges)"}
              {plan.name === "Starter" && "$0.50 per 1,000 additional requests (up to 200k total)"}
              {plan.name === "Pro" && "$0.40 per 1,000 additional requests (up to 750k total)"}
              {plan.name === "Agency" && "Custom overage rates negotiated"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const [monthlySpend, setMonthlySpend] = React.useState(500);
  const [cacheHitRate, setCacheHitRate] = React.useState(50);

  const safeSpend = Number.isFinite(monthlySpend) ? Math.max(0, monthlySpend) : 0;
  const safeHitRate = Number.isFinite(cacheHitRate) ? Math.min(70, Math.max(30, cacheHitRate)) : 50;

  const savings = safeSpend * (safeHitRate / 100);
  const avgCostPerRequest = 0.002;
  const estimatedRequests = safeSpend > 0 ? Math.round(safeSpend / avgCostPerRequest) : 0;
  const recommendedPlan = estimatedRequests > 100000 ? "Pro" : "Starter";
  const planCost = recommendedPlan === "Pro" ? 99 : 49;
  const netSavings = savings - planCost;
  const dailySavings = savings / 30;
  const breakEven = dailySavings > 0 ? Math.ceil(planCost / dailySavings) : null;
  const annualSavings = netSavings * 12;

  const formatCurrency = (value: number) =>
    `$${Math.max(0, Math.round(value)).toLocaleString()}`;

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-4">
            Pricing
          </h2>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            Pays for itself in days
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            If you&apos;re spending $200+/month on OpenAI, these plans save you money.
          </p>
        </motion.div>

        {/* ROI Calculator */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent border border-purple-500/20 rounded-xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-text-primary">Calculate Your Savings</h3>
                <p className="text-sm text-text-secondary">
                  Estimate your savings from semantic caching in seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">
                    Current monthly OpenAI spend
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={safeSpend}
                      onChange={(event) => setMonthlySpend(Number(event.target.value))}
                      className="w-full bg-bg-surface border border-border-subtle rounded-md pl-7 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-secondary">
                      Expected cache hit rate
                    </label>
                    <span className="text-sm text-text-primary font-medium">{safeHitRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={70}
                    step={1}
                    value={safeHitRate}
                    onChange={(event) => setCacheHitRate(Number(event.target.value))}
                    className="w-full accent-purple-400"
                  />
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>30%</span>
                    <span>70%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-bg-surface/60 border border-border-subtle rounded-lg p-4">
                <p className="text-xs text-text-muted mb-1">Monthly savings from caching</p>
                <p className="text-lg font-semibold text-text-primary">{formatCurrency(savings)}</p>
              </div>
              <div className="bg-bg-surface/60 border border-border-subtle rounded-lg p-4">
                <p className="text-xs text-text-muted mb-1">Recommended plan</p>
                <p className="text-lg font-semibold text-text-primary">{recommendedPlan}</p>
              </div>
              <div className="bg-bg-surface/60 border border-border-subtle rounded-lg p-4">
                <p className="text-xs text-text-muted mb-1">Net savings after fee</p>
                <p className="text-lg font-semibold text-green-400">{formatCurrency(netSavings)}</p>
              </div>
              <div className="bg-bg-surface/60 border border-border-subtle rounded-lg p-4">
                <p className="text-xs text-text-muted mb-1">Break-even time</p>
                <p className="text-lg font-semibold text-text-primary">
                  {breakEven ? `${breakEven} days` : "—"}
                </p>
              </div>
              <div className="bg-bg-surface/60 border border-border-subtle rounded-lg p-4">
                <p className="text-xs text-text-muted mb-1">Annual savings</p>
                <p className="text-lg font-semibold text-text-primary">{formatCurrency(annualSavings)}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-text-muted">
                Assumes an average of $0.002 per request to estimate volume. Adjust after signup.
              </p>
              <Button asChild className="bg-white text-black hover:bg-white/90">
                <Link href="/signup">Start saving {formatCurrency(netSavings)}/month →</Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
