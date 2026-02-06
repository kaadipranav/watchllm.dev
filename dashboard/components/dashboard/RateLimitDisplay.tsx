'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Activity } from 'lucide-react';

interface RateLimitDisplayProps {
  plan: 'free' | 'starter' | 'pro';
  currentMonthRequests: number;
  cacheHitCount: number;
  apiForwardedCount: number;
}

const PLAN_LIMITS = {
  free: {
    requestsPerMonth: 10000,
    requestsPerMinute: 10,
  },
  starter: {
    requestsPerMonth: 100000,
    requestsPerMinute: 50,
  },
  pro: {
    requestsPerMonth: 250000,
    requestsPerMinute: 10000,
  },
};

export function RateLimitDisplay({ 
  plan, 
  currentMonthRequests, 
  cacheHitCount, 
  apiForwardedCount 
}: RateLimitDisplayProps) {
  const limits = PLAN_LIMITS[plan];
  const usagePercent = (currentMonthRequests / limits.requestsPerMonth) * 100;
  const cacheHitPercent = currentMonthRequests > 0 
    ? (cacheHitCount / currentMonthRequests) * 100 
    : 0;

  const remaining = Math.max(0, limits.requestsPerMonth - currentMonthRequests);
  const isNearLimit = usagePercent >= 80;
  const isOverLimit = usagePercent >= 100;

  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Usage & Rate Limits
          </CardTitle>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {plan.toUpperCase()} Plan
          </span>
        </div>
        <CardDescription>
          All requests count toward your limit—including cache hits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Usage Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Requests this month</span>
            <span className="text-muted-foreground">
              {currentMonthRequests.toLocaleString()} / {limits.requestsPerMonth.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={Math.min(usagePercent, 100)} 
            className={`h-2 ${isOverLimit ? 'bg-red-500/20' : isNearLimit ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{usagePercent.toFixed(1)}% used</span>
            <span>{remaining.toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Cache Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Cache Hits
              </span>
            </div>
            <div className="text-2xl font-bold text-white">
              {cacheHitCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cacheHitPercent.toFixed(1)}% of requests
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                API Forwarded
              </span>
            </div>
            <div className="text-2xl font-bold text-white">
              {apiForwardedCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((apiForwardedCount / currentMonthRequests) * 100).toFixed(1)}% forwarded
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <Alert className="border-blue-500/20 bg-blue-500/5">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-xs">
            <strong>Cache hits count toward your rate limit.</strong> This prevents abuse while 
            still giving you cost savings. The {cacheHitCount.toLocaleString()} cached requests above 
            cost you $0 but count toward your {limits.requestsPerMonth.toLocaleString()}/month limit.
          </AlertDescription>
        </Alert>

        {/* Rate Limit Warning */}
        {isNearLimit && !isOverLimit && (
          <Alert className="border-yellow-500/20 bg-yellow-500/5">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-xs">
              You&apos;ve used {usagePercent.toFixed(0)}% of your monthly limit. 
              Consider upgrading to avoid hitting your quota.
            </AlertDescription>
          </Alert>
        )}

        {isOverLimit && (
          <Alert className="border-red-500/20 bg-red-500/5">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-xs">
              <strong>Monthly limit exceeded.</strong> Upgrade your plan to continue making requests.
            </AlertDescription>
          </Alert>
        )}

        {/* Rate Limit Info */}
        <div className="pt-4 border-t border-white/[0.08]">
          <h4 className="text-sm font-medium text-white/80 mb-2">Per-minute rate limit</h4>
          <p className="text-xs text-muted-foreground">
            {limits.requestsPerMinute === 10000 ? 'Unlimited' : `${limits.requestsPerMinute} requests/minute`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
