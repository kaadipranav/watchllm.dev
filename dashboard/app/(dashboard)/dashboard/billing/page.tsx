"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { formatCurrency, formatNumber, PLAN_LIMITS, type Plan } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";

const plans: { name: Plan; description: string; features: string[] }[] = [
  {
    name: "free",
    description: "Perfect for side projects and experimentation",
    features: [
      "50,000 requests/month",
      "10 requests/minute rate limit",
      "Basic semantic caching",
      "7-day usage history",
      "Community support",
      "1 project",
    ],
  },
  {
    name: "starter",
    description: "For growing apps with moderate traffic",
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
  },
  {
    name: "pro",
    description: "For production apps with high traffic",
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
  },
];

function BillingContent() {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan>("free");
  const [usage, setUsage] = useState({ requests: 0, limit: PLAN_LIMITS.free.requestsPerMonth });
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const upgradeTo = searchParams.get("upgrade");

  useEffect(() => {
    // Mock fetch subscription
    const fetchSubscription = async () => {
      // In a real app, fetch from API/Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate explicit usage if possible, or leave as 0 for now until subscription logic is solid
      // For now, defaulting to 0 to respect "no mock data" rule
      setUsage({ requests: 0, limit: PLAN_LIMITS.free.requestsPerMonth });
    };

    fetchSubscription();

    // Show upgrade prompt if redirected from signup
    if (upgradeTo && plans.find((p) => p.name === upgradeTo)) {
      toast({
        title: "Upgrade to unlock more features",
        description: `Start your ${upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1)} plan trial today.`,
      });
    }
  }, [upgradeTo, toast]);

  const handleUpgrade = async (plan: Plan) => {
    if (plan === "free" || plan === currentPlan) return;

    setLoading(true);
    try {
      // Call API to create Stripe checkout session
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) throw new Error("Failed to create checkout session");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-portal", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to create portal session");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const usagePercent = (usage.requests / usage.limit) * 100;

  return (
    <div className="space-y-10 p-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Billing</p>
        <h1 className="text-4xl font-bold text-premium-text-primary">Billing</h1>
        <p className="text-lg text-premium-text-secondary">
          Manage your subscription and billing
        </p>
      </header>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are currently on the{" "}
                <span className="font-semibold capitalize">{currentPlan}</span> plan
              </CardDescription>
            </div>
            <Badge variant={currentPlan === "free" ? "secondary" : "default"} className="capitalize">
              {currentPlan}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Monthly Usage</span>
              <span>
                {formatNumber(usage.requests)} / {formatNumber(usage.limit)} requests
              </span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {usagePercent > 80 && "You're approaching your limit. Consider upgrading."}
              {usagePercent <= 80 && `${(100 - usagePercent).toFixed(0)}% remaining`}
            </p>
          </div>

          {/* Billing Info */}
          {currentPlan !== "free" && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                Manage
              </Button>
            </div>
          )}
        </CardContent>
        {currentPlan !== "free" && (
          <CardFooter>
            <Button variant="outline" onClick={handleManageSubscription} disabled={loading}>
              Manage Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-premium-text-primary">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === currentPlan;
            const planLimit = PLAN_LIMITS[plan.name];

            return (
              <Card
                key={plan.name}
                className="relative card-premium border border-premium-border-subtle bg-premium-bg-elevated p-0 shadow-premium-sm transition hover:shadow-premium-md"
              >
                {isCurrentPlan && (
                  <Badge className="absolute left-4 top-3 rounded-full bg-premium-bg-primary px-2 py-0.5 text-xs text-premium-text-secondary">
                    Current
                  </Badge>
                )}
                <CardHeader className="px-6 pt-6">
                  <CardTitle className="capitalize text-lg text-premium-text-primary">{plan.name}</CardTitle>
                  <CardDescription className="text-premium-text-secondary">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-premium-text-primary">
                      {formatCurrency(planLimit.price)}
                    </span>
                    {planLimit.price > 0 && (
                      <span className="text-sm text-premium-text-muted">/month</span>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-premium-text-secondary">
                        <Check className="h-4 w-4 text-premium-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="px-6 pb-6 pt-0">
                  {isCurrentPlan ? (
                    <Button
                      className="w-full rounded-premium-md border border-premium-border-subtle bg-premium-bg-primary text-premium-text-secondary"
                      variant="outline"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : plan.name === "free" ? (
                    <Button
                      className="w-full rounded-premium-md bg-premium-bg-primary text-premium-text-secondary"
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={loading}
                    >
                      Downgrade
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-premium-md bg-premium-accent text-white shadow-glow-accent hover:bg-premium-accent/90"
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={loading}
                      data-sa-event="upgrade"
                      data-sa-plan={plan.name}
                    >
                      Upgrade
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card className="card-premium border border-premium-border-subtle bg-premium-bg-elevated shadow-premium-sm">
        <CardHeader>
          <CardTitle className="text-premium-text-primary">Billing History</CardTitle>
          <CardDescription className="text-premium-text-secondary">View your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-premium-text-secondary">
            {currentPlan === "free"
              ? "No billing history yet. You are on the free plan."
              : "Billing history will appear here after your first payment."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-premium-bg-elevated p-8 rounded-premium-lg shadow-premium-sm">
      <Loader2 className="h-8 w-8 animate-spin text-premium-accent" />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingFallback />}>
      <BillingContent />
    </Suspense>
  );
}
