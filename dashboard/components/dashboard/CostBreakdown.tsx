'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';

interface CostBreakdownProps {
  apiCost: number;
  watchllmFee: number;
  totalCost: number;
  savings: number;
  savingsPercentage: number;
  cachedRequests: number;
  totalRequests: number;
  period: string;
}

export function CostBreakdown({
  apiCost,
  watchllmFee,
  totalCost,
  savings,
  savingsPercentage,
  cachedRequests,
  totalRequests,
  period,
}: CostBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const cacheHitRate = totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0;

  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-400" />
            <div>
              <CardTitle className="text-base">Cost Breakdown</CardTitle>
              <CardDescription className="text-xs mt-1">{period}</CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="border-green-400/30 text-green-400"
          >
            <TrendingDown className="h-3 w-3 mr-1" />
            {savingsPercentage.toFixed(1)}% saved
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Cost Breakdown */}
        <div className="space-y-3">
          {/* API Costs */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm">API Costs</span>
              <span className="text-xs text-muted-foreground">(paid to provider)</span>
            </div>
            <span className="text-sm font-semibold">{formatCurrency(apiCost)}</span>
          </div>

          {/* WatchLLM Fee */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-sm">WatchLLM Fee</span>
              <span className="text-xs text-muted-foreground">(platform fee)</span>
            </div>
            <span className="text-sm font-semibold">
              {watchllmFee > 0 ? formatCurrency(watchllmFee) : 'Included'}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.08]" />

          {/* Total */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.05] border border-white/[0.08]">
            <span className="text-sm font-medium">Total Cost</span>
            <span className="text-lg font-bold text-white">{formatCurrency(totalCost)}</span>
          </div>
        </div>

        {/* Savings Highlight */}
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Money Saved</p>
              <p className="text-xs text-green-400/70 mt-1">
                From {cachedRequests.toLocaleString()} cached requests ({cacheHitRate.toFixed(1)}% hit rate)
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-400">{formatCurrency(savings)}</p>
              <div className="flex items-center gap-1 text-green-400/70 mt-1">
                <TrendingDown className="h-3 w-3" />
                <span className="text-xs">{savingsPercentage.toFixed(1)}% reduction</span>
              </div>
            </div>
          </div>
        </div>

        {/* Request Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-muted-foreground">Total Requests</p>
            <p className="text-lg font-semibold mt-1">{totalRequests.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-muted-foreground">Cached Requests</p>
            <p className="text-lg font-semibold mt-1 text-green-400">{cachedRequests.toLocaleString()}</p>
          </div>
        </div>

        {/* Cost per Request */}
        <div className="text-center pt-4 border-t border-white/[0.08]">
          <p className="text-xs text-muted-foreground">Average cost per request</p>
          <p className="text-lg font-semibold mt-1">
            {totalRequests > 0 ? formatCurrency(totalCost / totalRequests) : '$0.00'}
          </p>
          <p className="text-xs text-green-400 mt-1">
            vs {totalRequests > 0 ? formatCurrency((totalCost + savings) / totalRequests) : '$0.00'} without caching
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface PricingStalenessAlertProps {
  provider: string;
  lastVerifiedAt: Date;
  daysStale: number;
}

export function PricingStalenessAlert({ provider, lastVerifiedAt, daysStale }: PricingStalenessAlertProps) {
  if (daysStale < 7) return null;

  const severity = daysStale > 30 ? 'critical' : daysStale > 14 ? 'warning' : 'info';

  return (
    <Alert 
      className={
        severity === 'critical' 
          ? 'border-red-500/20 bg-red-500/5' 
          : severity === 'warning'
          ? 'border-yellow-500/20 bg-yellow-500/5'
          : 'border-blue-500/20 bg-blue-500/5'
      }
    >
      <AlertTriangle className={`h-4 w-4 ${
        severity === 'critical' ? 'text-red-400' : 
        severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
      }`} />
      <AlertTitle className="text-sm">
        {severity === 'critical' ? 'Pricing Data Outdated' : 'Pricing May Be Stale'}
      </AlertTitle>
      <AlertDescription className="text-xs">
        Using {provider} pricing from {lastVerifiedAt.toLocaleDateString()}. 
        Cost estimates may differ from actual charges.
        {daysStale > 14 && ' Consider verifying current pricing.'}
      </AlertDescription>
    </Alert>
  );
}

interface CostVarianceDisplayProps {
  providerBilled: number;
  watchllmEstimate: number;
  variancePercentage: number;
}

export function CostVarianceDisplay({ providerBilled, watchllmEstimate, variancePercentage }: CostVarianceDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const isAccurate = Math.abs(variancePercentage) < 2;
  const isMinor = Math.abs(variancePercentage) < 5;
  const overEstimated = variancePercentage > 0;

  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Cost Accuracy</CardTitle>
          <Badge 
            variant="outline" 
            className={
              isAccurate 
                ? 'border-green-400/30 text-green-400' 
                : isMinor
                ? 'border-yellow-400/30 text-yellow-400'
                : 'border-red-400/30 text-red-400'
            }
          >
            {isAccurate ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Accurate
              </>
            ) : (
              <>
                <Percent className="h-3 w-3 mr-1" />
                {Math.abs(variancePercentage).toFixed(1)}% variance
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-muted-foreground">WatchLLM Estimate</p>
            <p className="text-lg font-semibold mt-1">{formatCurrency(watchllmEstimate)}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-muted-foreground">Actual Provider Bill</p>
            <p className="text-lg font-semibold mt-1">{formatCurrency(providerBilled)}</p>
          </div>
        </div>

        <div className={`p-3 rounded-lg ${
          isAccurate ? 'bg-green-500/10 border border-green-500/20' :
          isMinor ? 'bg-yellow-500/10 border border-yellow-500/20' :
          'bg-red-500/10 border border-red-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm">Variance</span>
            <div className="flex items-center gap-1">
              {overEstimated ? (
                <ArrowUpRight className={`h-4 w-4 ${isAccurate ? 'text-green-400' : isMinor ? 'text-yellow-400' : 'text-red-400'}`} />
              ) : (
                <ArrowDownRight className={`h-4 w-4 ${isAccurate ? 'text-green-400' : isMinor ? 'text-yellow-400' : 'text-red-400'}`} />
              )}
              <span className={`font-semibold ${isAccurate ? 'text-green-400' : isMinor ? 'text-yellow-400' : 'text-red-400'}`}>
                {overEstimated ? '+' : ''}{variancePercentage.toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isAccurate 
              ? 'Cost estimates are highly accurate.' 
              : overEstimated
              ? 'We slightly overestimated your costs. Your actual spending is lower.'
              : 'We underestimated your costs. Consider reviewing model usage.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
