/**
 * Insights Engine
 * 
 * Derives opinionated, actionable judgments from observability data.
 * This is the core of WatchLLM's value proposition.
 * 
 * Philosophy:
 * - Don't show metrics, show judgments
 * - Every insight should make the user feel something
 * - "You're wasting money" > "Your cache hit rate is 54%"
 */

import { SMART_DEFAULTS } from './icp';

// ============================================
// TYPES
// ============================================

export interface InsightBase {
  id: string;
  type: InsightType;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impact_usd: number;
  created_at: string;
}

export type InsightType = 
  | 'wasted_spend'
  | 'cost_wasting_endpoint'
  | 'over_prompted_request'
  | 'cache_threshold_misconfigured'
  | 'model_swap_suggestion';

export interface WastedSpendInsight extends InsightBase {
  type: 'wasted_spend';
  data: {
    total_cost_usd: number;
    wasted_cost_usd: number;
    wasted_percentage: number;
    cache_miss_count: number;
    near_hit_count: number; // Requests that were close to cache threshold
  };
}

export interface CostWastingEndpointInsight extends InsightBase {
  type: 'cost_wasting_endpoint';
  data: {
    endpoint: string;
    total_cost_usd: number;
    cache_hit_rate: number;
    wasted_cost_estimate: number;
    request_count: number;
    recommendation: string;
  };
}

export interface OverPromptedRequestInsight extends InsightBase {
  type: 'over_prompted_request';
  data: {
    prompt_hash: string;
    prompt_preview: string;
    input_tokens: number;
    similar_prompts_count: number;
    potential_savings_usd: number;
    recommendation: string;
  };
}

export interface CacheThresholdInsight extends InsightBase {
  type: 'cache_threshold_misconfigured';
  data: {
    current_threshold: number;
    suggested_threshold: number;
    near_miss_count: number;
    estimated_savings_usd: number;
    similarity_distribution: { bucket: string; count: number }[];
  };
}

export interface ModelSwapInsight extends InsightBase {
  type: 'model_swap_suggestion';
  data: {
    current_model: string;
    suggested_model: string;
    use_case_detected: string;
    current_cost_usd: number;
    projected_cost_usd: number;
    savings_usd: number;
    confidence: number;
  };
}

export type Insight = 
  | WastedSpendInsight 
  | CostWastingEndpointInsight 
  | OverPromptedRequestInsight
  | CacheThresholdInsight
  | ModelSwapInsight;

// Raw data types from analytics
export interface RequestData {
  request_id: string;
  endpoint?: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  cached: boolean;
  similarity_score?: number;
  prompt_hash?: string;
  prompt_preview?: string;
  timestamp: string;
  latency_ms: number;
}

export interface EndpointStats {
  endpoint: string;
  total_requests: number;
  cached_requests: number;
  total_cost_usd: number;
  avg_latency_ms: number;
}

// ============================================
// INSIGHT GENERATORS
// ============================================

/**
 * INSIGHT A: Wasted LLM Spend (THE signature stat)
 * 
 * Definition: Cost of requests that:
 * - Missed cache
 * - But had semantic similarity > threshold (near misses)
 * 
 * This is WatchLLM's "oh sh*t" metric.
 */
export function calculateWastedSpend(
  requests: RequestData[],
  threshold: number = SMART_DEFAULTS.cache.similarity_threshold
): WastedSpendInsight | null {
  if (requests.length === 0) return null;

  const totalCost = requests.reduce((sum, r) => sum + r.cost_usd, 0);
  
  // Find cache misses that were CLOSE to hitting
  const nearMisses = requests.filter(r => 
    !r.cached && 
    r.similarity_score !== undefined && 
    r.similarity_score >= threshold * 0.9 && // Within 10% of threshold
    r.similarity_score < threshold
  );
  
  // Also count cache misses that DID have a similar cached response
  const wastedRequests = requests.filter(r =>
    !r.cached &&
    r.similarity_score !== undefined &&
    r.similarity_score >= threshold
  );
  
  const wastedCost = wastedRequests.reduce((sum, r) => sum + r.cost_usd, 0);
  const wastedPercentage = totalCost > 0 ? (wastedCost / totalCost) * 100 : 0;
  
  // Only surface if there's meaningful waste
  if (wastedCost < 0.01 && nearMisses.length === 0) return null;
  
  return {
    id: `wasted-spend-${Date.now()}`,
    type: 'wasted_spend',
    severity: wastedPercentage > 20 ? 'critical' : wastedPercentage > 10 ? 'warning' : 'info',
    title: `$${wastedCost.toFixed(2)} wasted on duplicate requests`,
    description: `${wastedPercentage.toFixed(1)}% of your LLM spend is going to requests that could have been cached.`,
    impact_usd: wastedCost,
    created_at: new Date().toISOString(),
    data: {
      total_cost_usd: totalCost,
      wasted_cost_usd: wastedCost,
      wasted_percentage: wastedPercentage,
      cache_miss_count: requests.filter(r => !r.cached).length,
      near_hit_count: nearMisses.length,
    },
  };
}

/**
 * INSIGHT B: Top Cost-Wasting Endpoints
 * 
 * Groups requests by endpoint/route and flags those where:
 * - Cache hit rate < 30%
 * - AND total cost is in top 20%
 */
export function findCostWastingEndpoints(
  requests: RequestData[],
  endpointStats: EndpointStats[]
): CostWastingEndpointInsight[] {
  if (endpointStats.length === 0) return [];

  // Sort by cost to find top 20%
  const sortedByCost = [...endpointStats].sort((a, b) => b.total_cost_usd - a.total_cost_usd);
  const top20PercentCount = Math.max(1, Math.ceil(sortedByCost.length * 0.2));
  const top20PercentCostEndpoints = new Set(
    sortedByCost.slice(0, top20PercentCount).map(e => e.endpoint)
  );

  const insights: CostWastingEndpointInsight[] = [];

  for (const stat of endpointStats) {
    const cacheHitRate = stat.total_requests > 0 
      ? (stat.cached_requests / stat.total_requests) * 100 
      : 0;
    
    // Flag if cache hit rate < 30% AND in top 20% by cost
    if (cacheHitRate < 30 && top20PercentCostEndpoints.has(stat.endpoint)) {
      const wastedEstimate = stat.total_cost_usd * (1 - cacheHitRate / 100) * 0.7; // Assume 70% could be cached
      
      insights.push({
        id: `cost-wasting-${stat.endpoint}-${Date.now()}`,
        type: 'cost_wasting_endpoint',
        severity: wastedEstimate > 50 ? 'critical' : wastedEstimate > 10 ? 'warning' : 'info',
        title: `"${stat.endpoint}" is wasting ~${((1 - cacheHitRate / 100) * 100).toFixed(0)}% of LLM spend`,
        description: `This endpoint has a ${cacheHitRate.toFixed(1)}% cache hit rate but accounts for significant cost.`,
        impact_usd: wastedEstimate,
        created_at: new Date().toISOString(),
        data: {
          endpoint: stat.endpoint,
          total_cost_usd: stat.total_cost_usd,
          cache_hit_rate: cacheHitRate,
          wasted_cost_estimate: wastedEstimate,
          request_count: stat.total_requests,
          recommendation: cacheHitRate < 10 
            ? "Review prompts for this endpoint—they may have high variance that defeats caching."
            : "Consider prompt templating to increase cache hits.",
        },
      });
    }
  }

  return insights.sort((a, b) => b.impact_usd - a.impact_usd);
}

/**
 * INSIGHT C: Over-Prompted Requests
 * 
 * Detect prompts with:
 * - Very high input tokens (>2000)
 * - High semantic similarity to other prompts
 * - Flag as "Likely prompt duplication" or "Could be shortened"
 */
export function findOverPromptedRequests(
  requests: RequestData[]
): OverPromptedRequestInsight[] {
  if (requests.length === 0) return [];

  const insights: OverPromptedRequestInsight[] = [];
  
  // Group by prompt hash to find duplicates
  const promptGroups = new Map<string, RequestData[]>();
  for (const req of requests) {
    if (req.prompt_hash) {
      const existing = promptGroups.get(req.prompt_hash) || [];
      existing.push(req);
      promptGroups.set(req.prompt_hash, existing);
    }
  }

  // Find high-token prompts with duplicates
  for (const [hash, group] of promptGroups) {
    const avgTokens = group.reduce((sum, r) => sum + r.input_tokens, 0) / group.length;
    const totalCost = group.reduce((sum, r) => sum + r.cost_usd, 0);
    
    // Flag if: high tokens (>2000) AND multiple similar requests AND significant cost
    if (avgTokens > 2000 && group.length > 3 && totalCost > 1) {
      const uncachedCost = group.filter(r => !r.cached).reduce((sum, r) => sum + r.cost_usd, 0);
      
      insights.push({
        id: `over-prompted-${hash}-${Date.now()}`,
        type: 'over_prompted_request',
        severity: uncachedCost > 20 ? 'critical' : uncachedCost > 5 ? 'warning' : 'info',
        title: "Repetitive long prompts detected",
        description: `${group.length} similar requests with ~${Math.round(avgTokens)} tokens each.`,
        impact_usd: uncachedCost,
        created_at: new Date().toISOString(),
        data: {
          prompt_hash: hash,
          prompt_preview: group[0].prompt_preview || "(preview unavailable)",
          input_tokens: Math.round(avgTokens),
          similar_prompts_count: group.length,
          potential_savings_usd: uncachedCost * 0.8, // Assume 80% could be avoided
          recommendation: avgTokens > 4000
            ? "This prompt is very long. Consider extracting common context into system prompts."
            : "These prompts are similar but not hitting cache. Check for minor variations.",
        },
      });
    }
  }

  return insights.sort((a, b) => b.impact_usd - a.impact_usd).slice(0, 5);
}

/**
 * INSIGHT D: Cache Threshold Misconfiguration
 * 
 * If average similarity scores cluster near threshold, suggest adjustment.
 */
export function analyzeCacheThreshold(
  requests: RequestData[],
  currentThreshold: number = SMART_DEFAULTS.cache.similarity_threshold
): CacheThresholdInsight | null {
  const requestsWithSimilarity = requests.filter(r => r.similarity_score !== undefined);
  if (requestsWithSimilarity.length < 50) return null; // Need enough data

  // Build distribution buckets (0.80-0.85, 0.85-0.90, 0.90-0.95, 0.95-1.00)
  const buckets = [
    { min: 0.80, max: 0.85, label: "80-85%", count: 0 },
    { min: 0.85, max: 0.90, label: "85-90%", count: 0 },
    { min: 0.90, max: 0.95, label: "90-95%", count: 0 },
    { min: 0.95, max: 1.00, label: "95-100%", count: 0 },
  ];

  for (const req of requestsWithSimilarity) {
    const score = req.similarity_score!;
    for (const bucket of buckets) {
      if (score >= bucket.min && score < bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  // Find near-misses (just below current threshold)
  const nearMisses = requestsWithSimilarity.filter(r => 
    !r.cached && 
    r.similarity_score! >= currentThreshold - 0.05 &&
    r.similarity_score! < currentThreshold
  );

  if (nearMisses.length < 10) return null; // Not enough near-misses to matter

  const nearMissCost = nearMisses.reduce((sum, r) => sum + r.cost_usd, 0);
  
  // Suggest lowering threshold if lots of near-misses
  const suggestedThreshold = currentThreshold - 0.03; // Lower by 3%
  
  return {
    id: `threshold-${Date.now()}`,
    type: 'cache_threshold_misconfigured',
    severity: nearMissCost > 20 ? 'critical' : nearMissCost > 5 ? 'warning' : 'info',
    title: `Lower cache threshold to catch ${nearMisses.length} more hits`,
    description: `Your current ${(currentThreshold * 100).toFixed(0)}% threshold is missing ${nearMisses.length} requests that are very similar.`,
    impact_usd: nearMissCost,
    created_at: new Date().toISOString(),
    data: {
      current_threshold: currentThreshold,
      suggested_threshold: suggestedThreshold,
      near_miss_count: nearMisses.length,
      estimated_savings_usd: nearMissCost * 0.9, // Most would become hits
      similarity_distribution: buckets.map(b => ({ bucket: b.label, count: b.count })),
    },
  };
}

/**
 * INSIGHT E: Model Cost Swap Suggestions
 * 
 * If same prompt pattern uses expensive model for simple tasks, suggest cheaper.
 */
export function findModelSwapOpportunities(
  requests: RequestData[]
): ModelSwapInsight[] {
  if (requests.length === 0) return [];

  // Model cost tiers (relative)
  const modelTiers: Record<string, { tier: number; cheaperAlt?: string; useCase: string }> = {
    'gpt-4': { tier: 4, cheaperAlt: 'gpt-4o-mini', useCase: 'complex reasoning' },
    'gpt-4-turbo': { tier: 4, cheaperAlt: 'gpt-4o-mini', useCase: 'complex reasoning' },
    'gpt-4o': { tier: 3, cheaperAlt: 'gpt-4o-mini', useCase: 'general purpose' },
    'gpt-4o-mini': { tier: 1, useCase: 'fast responses' },
    'gpt-3.5-turbo': { tier: 1, useCase: 'simple tasks' },
    'claude-3-opus': { tier: 4, cheaperAlt: 'claude-3-sonnet', useCase: 'complex analysis' },
    'claude-3-sonnet': { tier: 2, cheaperAlt: 'claude-3-haiku', useCase: 'balanced' },
    'claude-3-haiku': { tier: 1, useCase: 'fast responses' },
  };

  // Estimate cost multipliers
  const costMultipliers: Record<string, number> = {
    'gpt-4': 1,
    'gpt-4-turbo': 0.8,
    'gpt-4o': 0.5,
    'gpt-4o-mini': 0.1,
    'gpt-3.5-turbo': 0.05,
    'claude-3-opus': 1.2,
    'claude-3-sonnet': 0.3,
    'claude-3-haiku': 0.05,
  };

  // Group by model
  const modelGroups = new Map<string, RequestData[]>();
  for (const req of requests) {
    const existing = modelGroups.get(req.model) || [];
    existing.push(req);
    modelGroups.set(req.model, existing);
  }

  const insights: ModelSwapInsight[] = [];

  for (const [model, group] of modelGroups) {
    const modelInfo = modelTiers[model];
    if (!modelInfo || !modelInfo.cheaperAlt || modelInfo.tier < 3) continue;

    const totalCost = group.reduce((sum, r) => sum + r.cost_usd, 0);
    if (totalCost < 5) continue; // Not enough to matter

    // Heuristic: if avg output tokens < 500, probably a simple task
    const avgOutputTokens = group.reduce((sum, r) => sum + r.output_tokens, 0) / group.length;
    const isSimpleTask = avgOutputTokens < 500;

    if (!isSimpleTask) continue;

    const currentMultiplier = costMultipliers[model] || 1;
    const altMultiplier = costMultipliers[modelInfo.cheaperAlt] || 0.5;
    const projectedCost = totalCost * (altMultiplier / currentMultiplier);
    const savings = totalCost - projectedCost;

    insights.push({
      id: `model-swap-${model}-${Date.now()}`,
      type: 'model_swap_suggestion',
      severity: savings > 50 ? 'critical' : savings > 10 ? 'warning' : 'info',
      title: `Switch ${model} → ${modelInfo.cheaperAlt} and save $${savings.toFixed(2)}/period`,
      description: `You're using ${model} for what looks like simple tasks (avg ${Math.round(avgOutputTokens)} output tokens).`,
      impact_usd: savings,
      created_at: new Date().toISOString(),
      data: {
        current_model: model,
        suggested_model: modelInfo.cheaperAlt,
        use_case_detected: isSimpleTask ? "classification / short response" : "general",
        current_cost_usd: totalCost,
        projected_cost_usd: projectedCost,
        savings_usd: savings,
        confidence: isSimpleTask ? 0.8 : 0.5,
      },
    });
  }

  return insights.sort((a, b) => b.impact_usd - a.impact_usd);
}

// ============================================
// MAIN INSIGHTS AGGREGATOR
// ============================================

export interface InsightsResult {
  wastedSpend: WastedSpendInsight | null;
  costWastingEndpoints: CostWastingEndpointInsight[];
  overPromptedRequests: OverPromptedRequestInsight[];
  cacheThreshold: CacheThresholdInsight | null;
  modelSwaps: ModelSwapInsight[];
  totalImpactUsd: number;
  insightCount: number;
}

/**
 * Generate all insights from request data
 */
export function generateInsights(
  requests: RequestData[],
  endpointStats: EndpointStats[],
  currentThreshold?: number
): InsightsResult {
  const wastedSpend = calculateWastedSpend(requests, currentThreshold);
  const costWastingEndpoints = findCostWastingEndpoints(requests, endpointStats);
  const overPromptedRequests = findOverPromptedRequests(requests);
  const cacheThreshold = analyzeCacheThreshold(requests, currentThreshold);
  const modelSwaps = findModelSwapOpportunities(requests);

  const allInsights: Insight[] = [
    wastedSpend,
    ...costWastingEndpoints,
    ...overPromptedRequests,
    cacheThreshold,
    ...modelSwaps,
  ].filter((i): i is Insight => i !== null);

  return {
    wastedSpend,
    costWastingEndpoints,
    overPromptedRequests,
    cacheThreshold,
    modelSwaps,
    totalImpactUsd: allInsights.reduce((sum, i) => sum + i.impact_usd, 0),
    insightCount: allInsights.length,
  };
}
