"use client";

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
    cta: "Start Free Trial",
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
    cta: "Start Free Trial",
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
            Pays for itself in days
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            If you&apos;re spending $200+/month on OpenAI, these plans save you money.
          </p>
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
