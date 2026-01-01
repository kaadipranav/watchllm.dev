"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";

const plans = [
  {
    name: "Free",
    description: "Perfect for side projects needing caching + telemetry",
    price: "$0",
    period: "forever",
    features: [
      { text: "50K requests/month", included: true },
      { text: "10 requests/minute", included: true },
      { text: "Basic semantic caching", included: true },
      { text: "7-day usage history", included: true },
      { text: "Provider + project key onboarding", included: true },
      { text: "Basic observability telemetry (logs + metrics)", included: true },
      { text: "Community support", included: true },
      { text: "1 project", included: true },
      { text: "Priority support", included: false },
      { text: "Team members", included: false },
    ],
    cta: "Get Started",
    href: "/signup",
    popular: false,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    name: "Starter",
    description: "For growing applications that need analytics",
    price: "$49",
    period: "/month",
    features: [
      { text: "250K requests/month", included: true },
      { text: "50 requests/minute", included: true },
      { text: "Advanced semantic caching", included: true },
      { text: "30-day usage history", included: true },
      { text: "Realtime analytics & alerts", included: true },
      { text: "Observability dashboards", included: true },
      { text: "Email support", included: true },
      { text: "5 projects", included: true },
      { text: "Webhook notifications", included: true },
      { text: "Custom cache TTL", included: true },
      { text: "ClickHouse analytics", included: true },
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=starter",
    popular: true,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    name: "Pro",
    description: "For production workloads that demand observability",
    price: "$99",
    period: "/month",
    features: [
      { text: "1M requests/month", included: true },
      { text: "200 requests/minute", included: true },
      { text: "Priority semantic caching", included: true },
      { text: "90-day usage history", included: true },
      { text: "ClickHouse trace + log explorer", included: true },
      { text: "Unlimited observability projects", included: true },
      { text: "Retention controls (30/90 days)", included: true },
      { text: "Priority support", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Webhook notifications", included: true },
      { text: "Custom cache TTL", included: true },
      { text: "Team members (up to 5)", included: true },
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    popular: false,
    gradient: "from-amber-500 to-orange-500",
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
          <Badge variant="secondary" className="text-xs px-3 py-1">
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
            ? "border-border-default"
            : "border-border-subtle hover:border-border-default"
        )}
      >
        {/* Coming Soon Overlay */}
        {APP_CONFIG.showPricingComingSoon && plan.name !== "Free" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg-primary/95 backdrop-blur-sm rounded-lg border-2 border-dashed border-text-muted/30">
            <Badge variant="secondary" className="mb-3 px-4 py-1.5 text-sm font-semibold bg-accent-primary/10 text-accent-primary border-accent-primary/20">
              Coming Soon
            </Badge>
            <p className="text-sm text-text-secondary font-medium">
              Available after beta testing
            </p>
          </div>
        )}

        <div
          className={cn(
            "space-y-6",
            APP_CONFIG.showPricingComingSoon &&
            plan.name !== "Free" &&
            "blur-sm opacity-50"
          )}
        >
          {/* Header */}
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-text-secondary mb-2">
              {plan.name}
            </h3>
            <p className="text-sm text-text-muted">{plan.description}</p>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-baseline">
              <span className="text-5xl font-semibold font-mono text-text-primary">
                {plan.price}
              </span>
              <span className="ml-2 text-sm text-text-muted">
                {plan.period}
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
                {feature.included ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-success" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                )}
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="pt-6">
            <Button
              asChild
              variant={isPopular ? "default" : "secondary"}
              className="w-full"
              size="lg"
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Pricing() {
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
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Start free, upgrade when you need more. No hidden fees or surprises.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm text-text-muted">
            Need custom enterprise pricing?{" "}
            <a
              href={`mailto:${APP_CONFIG.salesEmail}`}
              className="text-accent-primary hover:underline transition-colors"
            >
              Contact sales
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
