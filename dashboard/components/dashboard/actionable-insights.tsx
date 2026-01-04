"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Zap, ArrowRight, DollarSign, Settings } from "lucide-react";
import Link from "next/link";
import type { 
  Insight, 
  WastedSpendInsight, 
  CostWastingEndpointInsight, 
  OverPromptedRequestInsight,
  CacheThresholdInsight,
  ModelSwapInsight 
} from "@/lib/insights";

// ============================================
// INSIGHT CARDS
// ============================================

function WastedSpendCard({ insight }: { insight: WastedSpendInsight }) {
  return (
    <Card className="border-red-500/30 bg-red-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <DollarSign className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-base text-red-300">Wasted LLM Spend</CardTitle>
              <CardDescription className="text-xs text-red-400/70">
                Your signature &quot;oh sh*t&quot; metric
              </CardDescription>
            </div>
          </div>
          <Badge variant="destructive" className="text-lg px-3 py-1">
            ${insight.data.wasted_cost_usd.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-white/70">{insight.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/50 text-xs mb-1">Total Spend</div>
            <div className="font-mono font-semibold">${insight.data.total_cost_usd.toFixed(2)}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/50 text-xs mb-1">Waste %</div>
            <div className="font-mono font-semibold text-red-400">
              {insight.data.wasted_percentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {insight.data.near_hit_count > 0 && (
          <div className="text-xs text-white/50">
            💡 {insight.data.near_hit_count} requests almost hit cache—consider lowering your threshold.
          </div>
        )}

        <div className="flex gap-2">
          <Link href="/dashboard/observability/logs">
            <Button size="sm" variant="outline" className="text-xs">
              View Requests <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CostWastingEndpointCard({ insight }: { insight: CostWastingEndpointInsight }) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <TrendingDown className="h-4 w-4 text-amber-400" />
            </div>
            <CardTitle className="text-sm text-amber-300">Cost-Wasting Endpoint</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-300">
            ~${insight.data.wasted_cost_estimate.toFixed(2)} waste
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <code className="text-xs bg-white/10 px-2 py-1 rounded">{insight.data.endpoint}</code>
        </div>
        <p className="text-sm text-white/70">{insight.title}</p>
        
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span>{insight.data.request_count} requests</span>
          <span>{insight.data.cache_hit_rate.toFixed(1)}% cache hit</span>
          <span>${insight.data.total_cost_usd.toFixed(2)} total</span>
        </div>

        <p className="text-xs text-white/60 bg-white/5 p-2 rounded">
          💡 {insight.data.recommendation}
        </p>

        <Link href={`/dashboard/observability/logs?endpoint=${encodeURIComponent(insight.data.endpoint)}`}>
          <Button size="sm" variant="ghost" className="text-xs">
            View Requests <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function OverPromptedCard({ insight }: { insight: OverPromptedRequestInsight }) {
  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <AlertTriangle className="h-4 w-4 text-blue-400" />
            </div>
            <CardTitle className="text-sm text-blue-300">Over-Prompted Requests</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
            ~${insight.data.potential_savings_usd.toFixed(2)} savable
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white/70">{insight.description}</p>
        
        <div className="text-xs bg-white/5 p-2 rounded font-mono text-white/50 line-clamp-2">
          {insight.data.prompt_preview}
        </div>

        <div className="flex items-center gap-4 text-xs text-white/50">
          <span>{insight.data.input_tokens} avg tokens</span>
          <span>{insight.data.similar_prompts_count} similar prompts</span>
        </div>

        <p className="text-xs text-white/60 bg-white/5 p-2 rounded">
          💡 {insight.data.recommendation}
        </p>
      </CardContent>
    </Card>
  );
}

function CacheThresholdCard({ insight }: { insight: CacheThresholdInsight }) {
  return (
    <Card className="border-purple-500/30 bg-purple-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Settings className="h-4 w-4 text-purple-400" />
            </div>
            <CardTitle className="text-sm text-purple-300">Cache Threshold Tuning</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
            +${insight.data.estimated_savings_usd.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white/70">{insight.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/50 text-xs mb-1">Current</div>
            <div className="font-mono font-semibold">
              {(insight.data.current_threshold * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-white/50 text-xs mb-1">Suggested</div>
            <div className="font-mono font-semibold text-purple-400">
              {(insight.data.suggested_threshold * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <p className="text-xs text-white/50">
          {insight.data.near_miss_count} requests are just below your threshold.
        </p>

        <Button size="sm" variant="outline" className="text-xs">
          Apply Recommendation
        </Button>
      </CardContent>
    </Card>
  );
}

function ModelSwapCard({ insight }: { insight: ModelSwapInsight }) {
  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Zap className="h-4 w-4 text-green-400" />
            </div>
            <CardTitle className="text-sm text-green-300">Model Swap Opportunity</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
            Save ${insight.data.savings_usd.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white/70">{insight.description}</p>
        
        <div className="flex items-center gap-2 text-sm">
          <code className="bg-white/10 px-2 py-1 rounded text-xs">{insight.data.current_model}</code>
          <ArrowRight className="h-3 w-3 text-white/30" />
          <code className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-300">
            {insight.data.suggested_model}
          </code>
        </div>

        <div className="text-xs text-white/50">
          Use case detected: {insight.data.use_case_detected}
          {insight.data.confidence >= 0.8 && " (high confidence)"}
        </div>

        <Button size="sm" variant="outline" className="text-xs">
          Learn More
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface ActionableInsightsProps {
  wastedSpend: WastedSpendInsight | null;
  costWastingEndpoints: CostWastingEndpointInsight[];
  overPromptedRequests: OverPromptedRequestInsight[];
  cacheThreshold: CacheThresholdInsight | null;
  modelSwaps: ModelSwapInsight[];
  totalImpactUsd: number;
  isLoading?: boolean;
}

export function ActionableInsights({
  wastedSpend,
  costWastingEndpoints,
  overPromptedRequests,
  cacheThreshold,
  modelSwaps,
  totalImpactUsd,
  isLoading = false,
}: ActionableInsightsProps) {
  const hasInsights = 
    wastedSpend || 
    costWastingEndpoints.length > 0 || 
    overPromptedRequests.length > 0 || 
    cacheThreshold ||
    modelSwaps.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-white/90">Actionable Insights</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!hasInsights) {
    return (
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-sm font-medium text-white/90 mb-2">Looking Good!</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            No obvious waste detected. Keep monitoring—insights appear as patterns emerge from your usage.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with total impact */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-white/90">Actionable Insights</h2>
          <p className="text-xs text-white/50">
            We found{" "}
            <span className="text-amber-400 font-medium">
              ${totalImpactUsd.toFixed(2)} in potential savings
            </span>
          </p>
        </div>
        <Link href="/dashboard/observability/logs">
          <Button variant="ghost" size="sm" className="text-xs">
            View All Requests <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      {/* Wasted Spend - The signature metric, always first */}
      {wastedSpend && (
        <WastedSpendCard insight={wastedSpend} />
      )}

      {/* Other insights in a grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {costWastingEndpoints.slice(0, 2).map((insight) => (
          <CostWastingEndpointCard key={insight.id} insight={insight} />
        ))}
        
        {overPromptedRequests.slice(0, 2).map((insight) => (
          <OverPromptedCard key={insight.id} insight={insight} />
        ))}
        
        {cacheThreshold && (
          <CacheThresholdCard insight={cacheThreshold} />
        )}
        
        {modelSwaps.slice(0, 2).map((insight) => (
          <ModelSwapCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}
