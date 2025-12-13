import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "Perfect for side projects and experimentation",
    price: "$0",
    period: "forever",
    features: [
      "50,000 requests/month",
      "10 requests/minute rate limit",
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
    description: "For growing apps with moderate traffic",
    price: "$29",
    period: "/month",
    features: [
      "250,000 requests/month",
      "50 requests/minute rate limit",
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
    description: "For production apps with high traffic",
    price: "$49",
    period: "/month",
    features: [
      "1,000,000 requests/month",
      "200 requests/minute rate limit",
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

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center space-y-3 mb-16">
          <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Pricing</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Transparent plans built for premium teams
          </h2>
          <p className="text-lg text-premium-text-secondary">
            Start free, upgrade when you need more, and get the full power of semantic caching with predictable pricing.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col gap-6 rounded-premium-2xl border border-premium-border-subtle bg-premium-bg-elevated/80 p-6 shadow-premium-lg transition duration-base ${
                plan.popular ? "ring-1 ring-premium-accent/60" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-premium-bg-secondary px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em]">
                  Most Popular
                </Badge>
              )}
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-premium-text-primary">{plan.name}</h3>
                <p className="text-sm text-premium-text-secondary">{plan.description}</p>
              </div>

              <div className="space-y-0">
                <span className="text-4xl font-bold text-premium-text-primary">{plan.price}</span>
                <p className="text-xs uppercase tracking-[0.3em] text-premium-text-muted">{plan.period}</p>
              </div>

              <ul className="flex-1 space-y-3 text-sm text-premium-text-secondary">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 text-premium-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="mt-auto">
                <Button
                  className={`w-full rounded-premium-xl px-4 py-3 text-sm font-semibold ${
                    plan.popular
                      ? "bg-gradient-to-r from-premium-accent to-premium-accent/80 text-white shadow-glow-accent"
                      : "border border-premium-border-subtle text-premium-text-primary"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-xs uppercase tracking-[0.4em] text-premium-text-muted">
          Need a custom plan? Email <Link href="mailto:support@watchllm.com" className="text-premium-accent">support@watchllm.com</Link>
        </p>
      </div>
    </section>
  );
}
