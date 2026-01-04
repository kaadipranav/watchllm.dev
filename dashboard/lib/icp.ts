/**
 * ICP (Ideal Customer Profile) Constants
 * 
 * WatchLLM's target user, hardcoded to inform all UI copy and product decisions.
 * This is NOT a config file - it's a product decision document in code.
 */

export const ICP = {
  // Who we're building for
  profile: "Teams spending real money on LLM APIs who want immediate cost visibility and savings",
  
  // Spending range we optimize for
  monthlySpend: {
    min: 200,
    max: 5000,
    sweet_spot: 1000,
  },
  
  // Team characteristics
  team: {
    size: "small teams / startups",
    technical_level: "developers who use OpenAI/Anthropic directly",
    pain_points: [
      "No visibility into what's actually costing money",
      "Can't tell which endpoints waste spend",
      "Don't know if caching is actually helping",
      "Debugging LLM issues is painful",
    ],
  },
  
  // What they care about (in order)
  priorities: [
    "cost",
    "latency",
    "debugging",
  ],
  
  // The promise in one sentence
  value_prop: "It tells me where my LLM spend is dumb",
  
  // Time to value target
  time_to_value_minutes: 10,
};

/**
 * Copy guidelines derived from ICP
 */
export const COPY = {
  // Dashboard
  dashboard: {
    title: "Dashboard",
    subtitle: "See where your LLM spend is leaking",
  },
  
  // Observability
  observability: {
    description: "Every LLM request is logged, priced, and traceable",
  },
  
  // Cache hit messaging
  cacheHit: {
    // Instead of "54.2% cache hit rate"
    format: (missRate: number) => `${missRate.toFixed(1)}% of requests are still costing you money`,
  },
  
  // Savings messaging
  savings: {
    // Instead of "You saved $X"
    format: (wasted: number) => `You're wasting $${wasted.toFixed(2)} on duplicate requests`,
  },
  
  // Insights language (assertive, not passive)
  insights: {
    wastedSpend: "This endpoint is wasting ~{amount}% of LLM spend",
    duplicatePrompts: "These prompts are nearly identical—cache them",
    modelSwap: "Switch to {cheaper} and save ${amount}/month",
    thresholdFix: "Raise your cache threshold to catch {count} more hits",
  },
};

/**
 * Default settings that "feel smart"
 */
export const SMART_DEFAULTS = {
  // Observability
  observability: {
    enabled_by_default: true,
    retention_days: 30,
  },
  
  // Caching
  cache: {
    similarity_threshold: 0.92, // 92% - aggressive enough to help, not so aggressive it's wrong
    ttl_seconds: 86400 * 7, // 7 days
  },
  
  // Alerts
  alerts: {
    cost_spike_percentage: 50, // Alert if daily cost spikes 50%+
    error_rate_threshold: 5, // Alert if error rate > 5%
  },
};
