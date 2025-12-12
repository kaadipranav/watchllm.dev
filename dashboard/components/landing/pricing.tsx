import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you need more. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={plan.href} className="w-full">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Link */}
        <p className="text-center mt-12 text-muted-foreground">
          Have questions? Check out our{" "}
          <Link href="#faq" className="text-primary hover:underline">
            FAQ
          </Link>{" "}
          or{" "}
          <Link href="mailto:support@watchllm.com" className="text-primary hover:underline">
            contact us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
