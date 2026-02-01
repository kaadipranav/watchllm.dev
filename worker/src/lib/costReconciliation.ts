/**
 * Cost Reconciliation Service
 * 
 * Enables users to import their actual provider bills and compare
 * against WatchLLM's estimates to ensure accuracy.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface BillImport {
  provider: 'openai' | 'anthropic' | 'groq';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  totalAmount: number;
  breakdown?: BillBreakdownItem[];
}

export interface BillBreakdownItem {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface ReconciliationResult {
  id: string;
  provider: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  providerBilledAmount: number;
  watchllmEstimatedAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  status: 'accurate' | 'minor_variance' | 'significant_variance' | 'critical_variance';
  breakdown: {
    provider: BillBreakdownItem[];
    watchllm: BillBreakdownItem[];
    variances: ModelVariance[];
  };
}

export interface ModelVariance {
  model: string;
  providerCost: number;
  watchllmEstimate: number;
  variance: number;
  variancePercentage: number;
}

export interface ReconciliationSummary {
  totalReconciliations: number;
  averageVariance: number;
  maxVariance: number;
  accurateCount: number; // <2% variance
  minorVarianceCount: number; // 2-5% variance
  significantVarianceCount: number; // 5-10% variance
  criticalVarianceCount: number; // >10% variance
}

export class CostReconciliationService {
  constructor(
    private supabase: SupabaseClient,
    private projectId: string,
    private userId: string
  ) {}

  /**
   * Import a provider bill and create reconciliation record
   */
  async importBill(bill: BillImport): Promise<ReconciliationResult> {
    // Get WatchLLM's estimated usage for the same period
    const watchllmEstimate = await this.getWatchLLMEstimate(
      bill.provider,
      bill.billingPeriodStart,
      bill.billingPeriodEnd
    );

    const varianceAmount = watchllmEstimate.totalAmount - bill.totalAmount;
    const variancePercentage = bill.totalAmount > 0 
      ? (varianceAmount / bill.totalAmount) * 100 
      : 0;

    // Determine status based on variance
    let status: ReconciliationResult['status'];
    const absVariance = Math.abs(variancePercentage);
    if (absVariance < 2) {
      status = 'accurate';
    } else if (absVariance < 5) {
      status = 'minor_variance';
    } else if (absVariance < 10) {
      status = 'significant_variance';
    } else {
      status = 'critical_variance';
    }

    // Calculate model-level variances
    const modelVariances = this.calculateModelVariances(
      bill.breakdown || [],
      watchllmEstimate.breakdown
    );

    // Store reconciliation
    const { data, error } = await this.supabase
      .from('cost_reconciliation')
      .insert({
        project_id: this.projectId,
        user_id: this.userId,
        provider: bill.provider,
        billing_period_start: bill.billingPeriodStart.toISOString().split('T')[0],
        billing_period_end: bill.billingPeriodEnd.toISOString().split('T')[0],
        provider_billed_amount: bill.totalAmount,
        watchllm_estimated_amount: watchllmEstimate.totalAmount,
        provider_breakdown: bill.breakdown || [],
        watchllm_breakdown: watchllmEstimate.breakdown,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to store reconciliation:', error);
      throw new Error('Failed to import bill');
    }

    // If variance is significant, create a pricing alert
    if (absVariance > 5) {
      await this.createVarianceAlert(bill.provider, variancePercentage);
    }

    return {
      id: data.id,
      provider: bill.provider,
      billingPeriodStart: bill.billingPeriodStart,
      billingPeriodEnd: bill.billingPeriodEnd,
      providerBilledAmount: bill.totalAmount,
      watchllmEstimatedAmount: watchllmEstimate.totalAmount,
      varianceAmount,
      variancePercentage,
      status,
      breakdown: {
        provider: bill.breakdown || [],
        watchllm: watchllmEstimate.breakdown,
        variances: modelVariances,
      },
    };
  }

  /**
   * Get WatchLLM's estimated costs for a period
   */
  private async getWatchLLMEstimate(
    provider: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalAmount: number; breakdown: BillBreakdownItem[] }> {
    // Query our usage logs for the period
    const { data, error } = await this.supabase
      .from('request_logs')
      .select('model, tokens_input, tokens_output, estimated_cost')
      .eq('project_id', this.projectId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error || !data) {
      console.error('Failed to fetch usage logs:', error);
      return { totalAmount: 0, breakdown: [] };
    }

    // Aggregate by model
    const byModel = new Map<string, BillBreakdownItem>();
    let totalAmount = 0;

    for (const log of data) {
      const existing = byModel.get(log.model) || {
        model: log.model,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
      };

      existing.inputTokens += log.tokens_input || 0;
      existing.outputTokens += log.tokens_output || 0;
      existing.cost += log.estimated_cost || 0;
      totalAmount += log.estimated_cost || 0;

      byModel.set(log.model, existing);
    }

    return {
      totalAmount,
      breakdown: Array.from(byModel.values()),
    };
  }

  /**
   * Calculate variances at the model level
   */
  private calculateModelVariances(
    providerBreakdown: BillBreakdownItem[],
    watchllmBreakdown: BillBreakdownItem[]
  ): ModelVariance[] {
    const variances: ModelVariance[] = [];
    const watchllmByModel = new Map(watchllmBreakdown.map(item => [item.model, item]));

    for (const providerItem of providerBreakdown) {
      const watchllmItem = watchllmByModel.get(providerItem.model);
      const watchllmCost = watchllmItem?.cost || 0;
      const variance = watchllmCost - providerItem.cost;
      const variancePercentage = providerItem.cost > 0 
        ? (variance / providerItem.cost) * 100 
        : 0;

      variances.push({
        model: providerItem.model,
        providerCost: providerItem.cost,
        watchllmEstimate: watchllmCost,
        variance,
        variancePercentage,
      });
    }

    // Check for models in WatchLLM but not in provider bill
    for (const [model, item] of watchllmByModel) {
      if (!providerBreakdown.find(p => p.model === model)) {
        variances.push({
          model,
          providerCost: 0,
          watchllmEstimate: item.cost,
          variance: item.cost,
          variancePercentage: 100,
        });
      }
    }

    return variances.sort((a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage));
  }

  /**
   * Create an alert for significant variance
   */
  private async createVarianceAlert(provider: string, variancePercentage: number): Promise<void> {
    const severity = Math.abs(variancePercentage) > 10 ? 'critical' : 'warning';
    const message = `Cost variance of ${variancePercentage.toFixed(1)}% detected for ${provider}. ` +
      `Our estimates ${variancePercentage > 0 ? 'overestimated' : 'underestimated'} actual costs. ` +
      `Consider reviewing pricing data.`;

    await this.supabase.from('pricing_alerts').insert({
      alert_type: 'price_change_detected',
      provider,
      message,
      severity,
    });
  }

  /**
   * Get reconciliation history for the project
   */
  async getReconciliationHistory(): Promise<ReconciliationResult[]> {
    const { data, error } = await this.supabase
      .from('cost_reconciliation')
      .select('*')
      .eq('project_id', this.projectId)
      .order('billing_period_end', { ascending: false })
      .limit(12); // Last 12 months

    if (error || !data) {
      console.error('Failed to fetch reconciliation history:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      provider: row.provider,
      billingPeriodStart: new Date(row.billing_period_start),
      billingPeriodEnd: new Date(row.billing_period_end),
      providerBilledAmount: parseFloat(row.provider_billed_amount),
      watchllmEstimatedAmount: parseFloat(row.watchllm_estimated_amount),
      varianceAmount: parseFloat(row.variance_amount),
      variancePercentage: parseFloat(row.variance_percentage),
      status: this.getStatusFromVariance(parseFloat(row.variance_percentage)),
      breakdown: {
        provider: row.provider_breakdown || [],
        watchllm: row.watchllm_breakdown || [],
        variances: [],
      },
    }));
  }

  /**
   * Get reconciliation summary statistics
   */
  async getReconciliationSummary(): Promise<ReconciliationSummary> {
    const { data, error } = await this.supabase
      .from('cost_reconciliation')
      .select('variance_percentage')
      .eq('project_id', this.projectId);

    if (error || !data || data.length === 0) {
      return {
        totalReconciliations: 0,
        averageVariance: 0,
        maxVariance: 0,
        accurateCount: 0,
        minorVarianceCount: 0,
        significantVarianceCount: 0,
        criticalVarianceCount: 0,
      };
    }

    const variances = data.map(row => Math.abs(parseFloat(row.variance_percentage)));
    const averageVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
    const maxVariance = Math.max(...variances);

    return {
      totalReconciliations: data.length,
      averageVariance,
      maxVariance,
      accurateCount: variances.filter(v => v < 2).length,
      minorVarianceCount: variances.filter(v => v >= 2 && v < 5).length,
      significantVarianceCount: variances.filter(v => v >= 5 && v < 10).length,
      criticalVarianceCount: variances.filter(v => v >= 10).length,
    };
  }

  /**
   * Auto-tune pricing based on reconciliation data
   * This suggests pricing adjustments based on historical variance
   */
  async suggestPricingAdjustments(): Promise<Array<{
    model: string;
    currentInputPrice: number;
    suggestedInputPrice: number;
    currentOutputPrice: number;
    suggestedOutputPrice: number;
    basedOnSamples: number;
    confidence: 'low' | 'medium' | 'high';
  }>> {
    // Get all reconciliations with model breakdowns
    const { data, error } = await this.supabase
      .from('cost_reconciliation')
      .select('provider_breakdown, watchllm_breakdown')
      .eq('project_id', this.projectId)
      .not('provider_breakdown', 'is', null);

    if (error || !data || data.length < 3) {
      // Need at least 3 reconciliations for reliable suggestions
      return [];
    }

    // Aggregate variance data by model
    const modelData = new Map<string, { 
      samples: number; 
      totalVariance: number;
      providerTotal: number;
      watchllmTotal: number;
    }>();

    for (const row of data) {
      const providerBreakdown = row.provider_breakdown as BillBreakdownItem[] || [];
      const watchllmBreakdown = row.watchllm_breakdown as BillBreakdownItem[] || [];
      const watchllmByModel = new Map(watchllmBreakdown.map(item => [item.model, item]));

      for (const item of providerBreakdown) {
        const watchllmItem = watchllmByModel.get(item.model);
        if (!watchllmItem) continue;

        const existing = modelData.get(item.model) || {
          samples: 0,
          totalVariance: 0,
          providerTotal: 0,
          watchllmTotal: 0,
        };

        existing.samples += 1;
        existing.providerTotal += item.cost;
        existing.watchllmTotal += watchllmItem.cost;
        existing.totalVariance += (watchllmItem.cost - item.cost) / item.cost;

        modelData.set(item.model, existing);
      }
    }

    // Generate suggestions for models with enough data
    const suggestions: Array<{
      model: string;
      currentInputPrice: number;
      suggestedInputPrice: number;
      currentOutputPrice: number;
      suggestedOutputPrice: number;
      basedOnSamples: number;
      confidence: 'low' | 'medium' | 'high';
    }> = [];

    for (const [model, data] of modelData) {
      if (data.samples < 2) continue;

      const avgVariance = data.totalVariance / data.samples;
      const adjustmentFactor = 1 / (1 + avgVariance); // If we overestimate, reduce prices

      // Get current pricing
      const { data: pricing } = await this.supabase
        .from('model_pricing')
        .select('input_price_per_million, output_price_per_million')
        .eq('model', model)
        .eq('is_current', true)
        .single();

      if (!pricing) continue;

      const currentInputPrice = parseFloat(pricing.input_price_per_million);
      const currentOutputPrice = parseFloat(pricing.output_price_per_million);

      suggestions.push({
        model,
        currentInputPrice,
        suggestedInputPrice: currentInputPrice * adjustmentFactor,
        currentOutputPrice,
        suggestedOutputPrice: currentOutputPrice * adjustmentFactor,
        basedOnSamples: data.samples,
        confidence: data.samples >= 6 ? 'high' : data.samples >= 3 ? 'medium' : 'low',
      });
    }

    return suggestions;
  }

  private getStatusFromVariance(variancePercentage: number): ReconciliationResult['status'] {
    const absVariance = Math.abs(variancePercentage);
    if (absVariance < 2) return 'accurate';
    if (absVariance < 5) return 'minor_variance';
    if (absVariance < 10) return 'significant_variance';
    return 'critical_variance';
  }
}

/**
 * Parse OpenAI usage export CSV
 */
export function parseOpenAIUsageCSV(csvContent: string): BillImport {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  const breakdown: BillBreakdownItem[] = [];
  let totalAmount = 0;
  let minDate = new Date();
  let maxDate = new Date(0);

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });

    const cost = parseFloat(row['cost'] || row['amount'] || '0');
    totalAmount += cost;

    const date = new Date(row['date'] || row['timestamp'] || '');
    if (date < minDate) minDate = date;
    if (date > maxDate) maxDate = date;

    const model = row['model'] || row['model_id'] || 'unknown';
    const existing = breakdown.find(b => b.model === model);
    if (existing) {
      existing.cost += cost;
      existing.inputTokens += parseInt(row['input_tokens'] || row['prompt_tokens'] || '0');
      existing.outputTokens += parseInt(row['output_tokens'] || row['completion_tokens'] || '0');
    } else {
      breakdown.push({
        model,
        inputTokens: parseInt(row['input_tokens'] || row['prompt_tokens'] || '0'),
        outputTokens: parseInt(row['output_tokens'] || row['completion_tokens'] || '0'),
        cost,
      });
    }
  }

  return {
    provider: 'openai',
    billingPeriodStart: minDate,
    billingPeriodEnd: maxDate,
    totalAmount,
    breakdown,
  };
}

/**
 * Parse Anthropic usage JSON
 */
export function parseAnthropicUsageJSON(jsonContent: string): BillImport {
  const data = JSON.parse(jsonContent);
  const usage = data.usage || data;
  
  const breakdown: BillBreakdownItem[] = [];
  let totalAmount = 0;

  for (const item of (usage.line_items || usage.items || [])) {
    const cost = item.amount || item.cost || 0;
    totalAmount += cost;

    breakdown.push({
      model: item.model || 'claude-3-opus-20240229',
      inputTokens: item.input_tokens || 0,
      outputTokens: item.output_tokens || 0,
      cost,
    });
  }

  return {
    provider: 'anthropic',
    billingPeriodStart: new Date(usage.period_start || data.start_date),
    billingPeriodEnd: new Date(usage.period_end || data.end_date),
    totalAmount: usage.total || totalAmount,
    breakdown,
  };
}

/**
 * Create a cost reconciliation service
 */
export function createCostReconciliationService(
  supabase: SupabaseClient,
  projectId: string,
  userId: string
): CostReconciliationService {
  return new CostReconciliationService(supabase, projectId, userId);
}
