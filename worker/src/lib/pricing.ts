/**
 * Database-driven Model Pricing Service
 * 
 * Provides accurate cost calculations with:
 * - Database-backed pricing (not hardcoded)
 * - Staleness detection
 * - Batch API pricing support
 * - Anthropic prompt caching support
 * - Fine-tuned model pricing
 * - Embedding model support
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ModelPrice {
  provider: string;
  model: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  batchInputPricePerMillion?: number;
  batchOutputPricePerMillion?: number;
  cachedInputPricePerMillion?: number;
  isEmbeddingModel: boolean;
  isFineTuned: boolean;
  lastVerifiedAt: Date;
  isStale: boolean;
  sourceUrl?: string;
}

export interface CostCalculationResult {
  totalCost: number;
  inputCost: number;
  outputCost: number;
  cachedCost: number;
  breakdown: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
    cachedPricePerMillion: number;
  };
  isStale: boolean;
  pricingDate: Date;
}

export interface CostBreakdown {
  apiCost: number;           // Cost paid to provider
  watchllmFee: number;       // Platform fee
  totalCost: number;         // Total
  savings: number;           // Money saved from caching
  savingsPercentage: number; // Percentage saved
}

// Fallback pricing (per 1K tokens) for when database is unavailable
const FALLBACK_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-32k': { input: 0.06, output: 0.12 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-16k': { input: 0.001, output: 0.002 },
  'text-embedding-ada-002': { input: 0.0001, output: 0 },
  'text-embedding-3-small': { input: 0.00002, output: 0 },
  'text-embedding-3-large': { input: 0.00013, output: 0 },
  // Anthropic
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'claude-3-5-sonnet-20240620': { input: 0.003, output: 0.015 },
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  // Groq
  'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
  'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
  'llama3-groq-70b-8192-tool-use-preview': { input: 0.00089, output: 0.00089 },
  'mixtral-8x7b-32768': { input: 0.00024, output: 0.00024 },
  'gemma2-9b-it': { input: 0.0002, output: 0.0002 },
};

// Cache for pricing data to avoid repeated database calls
const pricingCache = new Map<string, { data: ModelPrice; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class PricingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get pricing for a model from the database
   */
  async getModelPricing(provider: string, model: string): Promise<ModelPrice | null> {
    const cacheKey = `${provider}:${model}`;
    const cached = pricingCache.get(cacheKey);
    
    // Check cache first
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const { data, error } = await this.supabase
        .from('model_pricing')
        .select('*')
        .eq('provider', provider)
        .eq('model', model)
        .eq('is_current', true)
        .single();

      if (error || !data) {
        return null;
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const pricing: ModelPrice = {
        provider: data.provider,
        model: data.model,
        inputPricePerMillion: parseFloat(data.input_price_per_million),
        outputPricePerMillion: parseFloat(data.output_price_per_million),
        batchInputPricePerMillion: data.batch_input_price_per_million 
          ? parseFloat(data.batch_input_price_per_million) 
          : undefined,
        batchOutputPricePerMillion: data.batch_output_price_per_million 
          ? parseFloat(data.batch_output_price_per_million) 
          : undefined,
        cachedInputPricePerMillion: data.cached_input_price_per_million 
          ? parseFloat(data.cached_input_price_per_million) 
          : undefined,
        isEmbeddingModel: data.is_embedding_model || false,
        isFineTuned: data.is_fine_tuned || false,
        lastVerifiedAt: new Date(data.last_verified_at),
        isStale: new Date(data.last_verified_at) < sevenDaysAgo,
        sourceUrl: data.source_url,
      };

      // Update cache
      pricingCache.set(cacheKey, { data: pricing, cachedAt: Date.now() });

      return pricing;
    } catch (error) {
      console.error('Failed to fetch pricing from database:', error);
      return null;
    }
  }

  /**
   * Calculate cost for a request with full breakdown
   */
  async calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    options: {
      isBatch?: boolean;
      cachedTokens?: number;
    } = {}
  ): Promise<CostCalculationResult> {
    const { isBatch = false, cachedTokens = 0 } = options;

    // Try database pricing first
    let pricing = await this.getModelPricing(provider, model);
    let isStale = false;
    let pricingDate = new Date();

    // Fall back to hardcoded pricing if database unavailable
    if (!pricing) {
      const fallback = FALLBACK_PRICING[model];
      if (fallback) {
        pricing = {
          provider,
          model,
          inputPricePerMillion: fallback.input * 1000, // Convert from per-1K to per-1M
          outputPricePerMillion: fallback.output * 1000,
          isEmbeddingModel: model.startsWith('text-embedding'),
          isFineTuned: false,
          lastVerifiedAt: new Date('2026-02-01'),
          isStale: true, // Mark as stale since using fallback
        };
        isStale = true;
        console.warn(`Using fallback pricing for ${provider}/${model}`);
      } else {
        // Unknown model - use default pricing
        pricing = {
          provider,
          model,
          inputPricePerMillion: 1.0, // $1 per 1M input
          outputPricePerMillion: 2.0, // $2 per 1M output
          isEmbeddingModel: false,
          isFineTuned: false,
          lastVerifiedAt: new Date('2026-02-01'),
          isStale: true,
        };
        isStale = true;
        console.warn(`Unknown model ${provider}/${model}, using default pricing`);
      }
    } else {
      isStale = pricing.isStale;
      pricingDate = pricing.lastVerifiedAt;
    }

    // Determine prices based on batch/cached context
    let inputPrice = pricing.inputPricePerMillion;
    let outputPrice = pricing.outputPricePerMillion;
    let cachedPrice = pricing.cachedInputPricePerMillion || inputPrice * 0.1; // Default 90% discount

    if (isBatch) {
      inputPrice = pricing.batchInputPricePerMillion || inputPrice * 0.5;
      outputPrice = pricing.batchOutputPricePerMillion || outputPrice * 0.5;
    }

    // Calculate costs
    const nonCachedInputTokens = Math.max(0, inputTokens - cachedTokens);
    const inputCost = (nonCachedInputTokens * inputPrice) / 1_000_000;
    const cachedCost = (cachedTokens * cachedPrice) / 1_000_000;
    const outputCost = (outputTokens * outputPrice) / 1_000_000;
    const totalCost = inputCost + cachedCost + outputCost;

    return {
      totalCost,
      inputCost,
      outputCost,
      cachedCost,
      breakdown: {
        inputTokens: nonCachedInputTokens,
        outputTokens,
        cachedTokens,
        inputPricePerMillion: inputPrice,
        outputPricePerMillion: outputPrice,
        cachedPricePerMillion: cachedPrice,
      },
      isStale,
      pricingDate,
    };
  }

  /**
   * Calculate cost breakdown with WatchLLM fee and savings
   */
  async calculateCostBreakdown(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    cachedRequests: number,
    totalRequests: number,
    options: {
      isBatch?: boolean;
      cachedTokens?: number;
      watchllmFeePercentage?: number;
    } = {}
  ): Promise<CostBreakdown> {
    const { watchllmFeePercentage = 0 } = options; // WatchLLM currently doesn't charge extra

    // Calculate cost for this request
    const costResult = await this.calculateCost(provider, model, inputTokens, outputTokens, options);
    const apiCost = costResult.totalCost;

    // Calculate WatchLLM fee (if any)
    const watchllmFee = apiCost * (watchllmFeePercentage / 100);

    // Estimate savings from cached requests
    // Assuming average request size for cached requests
    const avgInputTokens = inputTokens;
    const avgOutputTokens = outputTokens;
    const wouldHaveCost = cachedRequests > 0
      ? (await this.calculateCost(provider, model, avgInputTokens * cachedRequests, avgOutputTokens * cachedRequests)).totalCost
      : 0;

    const totalCost = apiCost + watchllmFee;
    const savingsPercentage = totalRequests > 0 
      ? (cachedRequests / totalRequests) * 100 
      : 0;

    return {
      apiCost,
      watchllmFee,
      totalCost,
      savings: wouldHaveCost,
      savingsPercentage,
    };
  }

  /**
   * Check for stale pricing that needs verification
   */
  async checkStalePricing(): Promise<Array<{
    provider: string;
    model: string;
    lastVerifiedAt: Date;
    daysSinceVerification: number;
  }>> {
    try {
      const { data, error } = await this.supabase.rpc('check_stale_pricing');

      if (error || !data) {
        console.error('Failed to check stale pricing:', error);
        return [];
      }

      return data.map((row: { provider: string; model: string; last_verified_at: string; days_since_verification: number }) => ({
        provider: row.provider,
        model: row.model,
        lastVerifiedAt: new Date(row.last_verified_at),
        daysSinceVerification: row.days_since_verification,
      }));
    } catch (error) {
      console.error('Error checking stale pricing:', error);
      return [];
    }
  }

  /**
   * Update model pricing (admin only)
   */
  async updateModelPricing(
    provider: string,
    model: string,
    inputPricePerMillion: number,
    outputPricePerMillion: number,
    updatedBy: string,
    changeReason?: string
  ): Promise<boolean> {
    try {
      // Get current pricing
      const { data: current } = await this.supabase
        .from('model_pricing')
        .select('id, input_price_per_million, output_price_per_million')
        .eq('provider', provider)
        .eq('model', model)
        .eq('is_current', true)
        .single();

      // Log the change
      if (current) {
        await this.supabase.from('pricing_update_log').insert({
          model_pricing_id: current.id,
          provider,
          model,
          old_input_price: current.input_price_per_million,
          new_input_price: inputPricePerMillion,
          old_output_price: current.output_price_per_million,
          new_output_price: outputPricePerMillion,
          change_type: 'update',
          change_reason: changeReason,
          updated_by: updatedBy,
        });

        // Update pricing
        await this.supabase
          .from('model_pricing')
          .update({
            input_price_per_million: inputPricePerMillion,
            output_price_per_million: outputPricePerMillion,
            last_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', current.id);
      } else {
        // Insert new pricing
        await this.supabase.from('model_pricing').insert({
          provider,
          model,
          input_price_per_million: inputPricePerMillion,
          output_price_per_million: outputPricePerMillion,
          verified_by: updatedBy,
        });

        // Log the addition
        await this.supabase.from('pricing_update_log').insert({
          provider,
          model,
          new_input_price: inputPricePerMillion,
          new_output_price: outputPricePerMillion,
          change_type: 'initial',
          change_reason: changeReason,
          updated_by: updatedBy,
        });
      }

      // Clear cache
      pricingCache.delete(`${provider}:${model}`);

      return true;
    } catch (error) {
      console.error('Failed to update model pricing:', error);
      return false;
    }
  }

  /**
   * Get all current pricing for dashboard display
   */
  async getAllPricing(): Promise<ModelPrice[]> {
    try {
      const { data, error } = await this.supabase
        .from('model_pricing')
        .select('*')
        .eq('is_current', true)
        .order('provider')
        .order('model');

      if (error || !data) {
        console.error('Failed to fetch all pricing:', error);
        return [];
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      return data.map(row => ({
        provider: row.provider,
        model: row.model,
        inputPricePerMillion: parseFloat(row.input_price_per_million),
        outputPricePerMillion: parseFloat(row.output_price_per_million),
        batchInputPricePerMillion: row.batch_input_price_per_million 
          ? parseFloat(row.batch_input_price_per_million) 
          : undefined,
        batchOutputPricePerMillion: row.batch_output_price_per_million 
          ? parseFloat(row.batch_output_price_per_million) 
          : undefined,
        cachedInputPricePerMillion: row.cached_input_price_per_million 
          ? parseFloat(row.cached_input_price_per_million) 
          : undefined,
        isEmbeddingModel: row.is_embedding_model || false,
        isFineTuned: row.is_fine_tuned || false,
        lastVerifiedAt: new Date(row.last_verified_at),
        isStale: new Date(row.last_verified_at) < sevenDaysAgo,
        sourceUrl: row.source_url,
      }));
    } catch (error) {
      console.error('Error fetching all pricing:', error);
      return [];
    }
  }

  /**
   * Create a pricing alert
   */
  async createPricingAlert(
    alertType: 'stale_pricing' | 'price_change_detected' | 'verification_needed',
    message: string,
    severity: 'info' | 'warning' | 'critical' = 'warning',
    provider?: string,
    model?: string
  ): Promise<void> {
    try {
      await this.supabase.from('pricing_alerts').insert({
        alert_type: alertType,
        provider,
        model,
        message,
        severity,
      });
    } catch (error) {
      console.error('Failed to create pricing alert:', error);
    }
  }

  /**
   * Get active pricing alerts
   */
  async getActivePricingAlerts(): Promise<Array<{
    id: string;
    alertType: string;
    provider?: string;
    model?: string;
    message: string;
    severity: string;
    createdAt: Date;
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('pricing_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data) {
        return [];
      }

      return data.map(row => ({
        id: row.id,
        alertType: row.alert_type,
        provider: row.provider,
        model: row.model,
        message: row.message,
        severity: row.severity,
        createdAt: new Date(row.created_at),
      }));
    } catch (error) {
      console.error('Error fetching pricing alerts:', error);
      return [];
    }
  }
}

/**
 * Create a pricing service instance
 */
export function createPricingService(supabase: SupabaseClient): PricingService {
  return new PricingService(supabase);
}

/**
 * Quick cost calculation using fallback pricing (for hot path)
 * Use when database access is too slow
 */
export function calculateCostFast(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = FALLBACK_PRICING[model] || { input: 0.001, output: 0.002 };
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;
}
