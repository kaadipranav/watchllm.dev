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
    description: "Perfect for side projects",
    features: [
      "50,000 requests/month",
      "10 req/min rate limit",
      "Basic caching",
      "7-day history",
    ],
  },
  {
    name: "starter",
    description: "For growing applications",
    features: [
      "250,000 requests/month",
      "50 req/min rate limit",
      "Advanced caching",
      "30-day history",
      "Email support",
    ],
  },
  {
    name: "pro",
    description: "For production apps",
    features: [
      "1,000,000 requests/month",
      "200 req/min rate limit",
      "Priority caching",
      "90-day history",
      "Priority support",
      "Team members",
    ],
  },
];

function BillingContent() {
  const [currentPlan, setCurrentPlan] = useState<Plan>("free");
  const [usage, setUsage] = useState({
    requests: 35000,
    limit: 50000,
  });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const upgradeTo = searchParams.get("upgrade") as Plan | null;

  useEffect(() => {
    // Fetch current subscription status
    const fetchSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In production, fetch from subscriptions table
      // For now, use mock data
    };

    fetchSubscription();

    // Show upgrade prompt if redirected from signup
    if (upgradeTo && plans.find((p) => p.name === upgradeTo)) {
      toast({
        title: "Upgrade to unlock more features",
        description: `Start your ${upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1)} plan trial today.`,
      });
    }
  }, [upgradeTo]);

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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

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
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === currentPlan;
            const planLimit = PLAN_LIMITS[plan.name];

            return (
              <Card
                key={plan.name}
                className={`relative ${isCurrentPlan ? "border-primary" : ""} ${
                  upgradeTo === plan.name ? "ring-2 ring-primary" : ""
                }`}
              >
                {isCurrentPlan && (
                  <Badge className="absolute -top-2 left-4">Current</Badge>
                )}
                <CardHeader>
                  <CardTitle className="capitalize">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">
                      {formatCurrency(planLimit.price)}
                    </span>
                    {planLimit.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : plan.name === "free" ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={loading}
                    >
                      Downgrade
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
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
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {currentPlan === "free" ? (
            <p className="text-muted-foreground text-center py-4">
              No billing history. You're on the free plan.
            </p>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Billing history will appear here after your first payment.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BillingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
