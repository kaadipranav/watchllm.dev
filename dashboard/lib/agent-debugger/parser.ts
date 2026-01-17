/**
 * Agent Debug Parser
 * 
 * Converts raw agent run logs into the debug view model.
 * Calculates per-step cost attribution, computes wasted spend heuristics,
 * and emits flags for anomalies.
 * 
 * @feature AGENT_DEBUGGER_V1
 */

import {
  AgentRun,
  AgentStep,
  AgentDebugViewModel,
  CostSummary,
  RunSummary,
  StepDebugView,
  Flag,
  FlagType,
  AgentDebuggerConfig,
  DEFAULT_AGENT_DEBUGGER_CONFIG,
} from './types';
import { sanitizeStep } from './sanitizer';
import { generateExplanation, ExplanationResult } from './explainer';

// ============================================================================
// Parser Class
// ============================================================================

export class AgentDebugParser {
  private config: AgentDebuggerConfig;

  constructor(config: Partial<AgentDebuggerConfig> = {}) {
    this.config = { ...DEFAULT_AGENT_DEBUGGER_CONFIG, ...config };
  }

  /**
   * Parse a raw agent run into a debug view model
   */
  async parse(run: AgentRun): Promise<AgentDebugViewModel> {
    // Sanitize steps if configured
    const sanitizedSteps = this.config.sanitize_pii
      ? run.steps.map(step => sanitizeStep(step, this.config))
      : run.steps;

    // Calculate cost summary (pass meta to extract caching opportunities)
    const costSummary = this.calculateCostSummary(sanitizedSteps, run.meta);

    // Detect flags for each step
    const stepsWithFlags = this.detectStepFlags(sanitizedSteps);

    // Generate explanations for steps
    const stepsWithExplanations = await this.generateStepExplanations(stepsWithFlags);

    // Build step debug views
    const stepDebugViews = this.buildStepDebugViews(stepsWithExplanations, costSummary.total_cost_usd);

    // Collect all flags for run summary
    const allFlags = this.collectAllFlags(stepDebugViews);

    // Build run summary
    const summary = this.buildRunSummary(run, costSummary, allFlags, stepDebugViews.length);

    return {
      summary,
      steps: stepDebugViews,
    };
  }

  /**
   * Calculate cost summary from steps
   */
  calculateCostSummary(steps: AgentStep[], runMeta?: Record<string, unknown>): CostSummary {
    let totalCost = 0;
    let wastedSpend = 0;
    let amountSaved = 0;
    let cacheHits = 0;
    let cacheableSteps = 0;

    let toolCallsCost = 0;
    let modelResponsesCost = 0;
    let retriesCost = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const cost = step.api_cost_usd ?? 0;
      totalCost += cost;

      // Track cost by type
      if (step.type === 'tool_call' || step.type === 'decision') {
        toolCallsCost += cost;
      } else if (step.type === 'model_response') {
        modelResponsesCost += cost;
      } else if (step.type === 'retry') {
        retriesCost += cost;
        wastedSpend += cost; // Retries are considered wasted
      }

      // Track cache metrics
      if (step.type === 'tool_call' || step.type === 'decision' || step.type === 'model_response') {
        cacheableSteps++;
        if (step.cache_hit) {
          cacheHits++;
          amountSaved += cost; // Cache hits save the full cost
        }
      }

      // Detect wasted spend from retries and repeated calls
      if (this.isWastedSpend(step, steps, i)) {
        wastedSpend += cost;
      }
    }

    const cacheHitRate = cacheableSteps > 0 ? (cacheHits / cacheableSteps) * 100 : 0;

    // Extract caching opportunities from run meta (set during ingestion)
    const cachingOpportunities = (runMeta?.caching_opportunities as any[]) || [];
    const potentialSavings = cachingOpportunities.reduce((sum, opp) => sum + (opp.saved_cost || 0), 0);

    return {
      total_cost_usd: roundCurrency(totalCost),
      wasted_spend_usd: roundCurrency(wastedSpend),
      amount_saved_usd: roundCurrency(amountSaved),
      potential_savings_usd: roundCurrency(potentialSavings),
      cache_hit_rate: roundPercentage(cacheHitRate),
      cacheable_requests: cachingOpportunities.length,
      caching_opportunities: cachingOpportunities,
      breakdown: {
        tool_calls_cost: roundCurrency(toolCallsCost),
        model_responses_cost: roundCurrency(modelResponsesCost),
        retries_cost: roundCurrency(retriesCost),
      },
    };
  }

  /**
   * Check if a step represents wasted spend
   */
  private isWastedSpend(step: AgentStep, allSteps: AgentStep[], index: number): boolean {
    // Retries following cache miss or timeout
    if (step.type === 'retry') {
      return true;
    }

    // Repeated tool calls producing same output
    if (step.type === 'tool_call' && step.tool) {
      const prevSimilar = allSteps.slice(0, index).filter(
        s => s.type === 'tool_call' && 
        s.tool === step.tool && 
        JSON.stringify(s.tool_args) === JSON.stringify(step.tool_args)
      );
      if (prevSimilar.length > 0 && prevSimilar.some(
        s => s.tool_output_summary === step.tool_output_summary
      )) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect flags for each step
   */
  detectStepFlags(steps: AgentStep[]): AgentStep[] {
    const result: AgentStep[] = [];
    const toolCallCounts: Record<string, number> = {};
    const typeTimestamps: Record<string, Date[]> = {};

    for (let i = 0; i < steps.length; i++) {
      const step = { ...steps[i], flags: [] as Flag[] };

      // Track tool calls
      if (step.tool) {
        toolCallCounts[step.tool] = (toolCallCounts[step.tool] ?? 0) + 1;
      }

      // Track type timestamps for loop detection
      const timestamp = new Date(step.timestamp);
      if (!typeTimestamps[step.type]) {
        typeTimestamps[step.type] = [];
      }
      typeTimestamps[step.type].push(timestamp);

      // Check for high cost
      if ((step.api_cost_usd ?? 0) >= this.config.high_cost_threshold_usd) {
        step.flags.push({
          type: 'high_cost_step',
          description: `Step cost $${step.api_cost_usd?.toFixed(4)} exceeds threshold`,
          severity: 'warning',
          details: {
            cost: step.api_cost_usd,
            threshold: this.config.high_cost_threshold_usd,
          },
        });
      }

      // Check for repeated tool
      if (step.tool && toolCallCounts[step.tool] >= this.config.repeated_tool_threshold) {
        step.flags.push({
          type: 'repeated_tool',
          description: `Tool "${step.tool}" called ${toolCallCounts[step.tool]} times`,
          severity: 'warning',
          details: {
            tool: step.tool,
            count: toolCallCounts[step.tool],
          },
        });
      }

      // Check for loop detection
      if (this.detectLoop(step.type, typeTimestamps[step.type])) {
        step.flags.push({
          type: 'loop_detected',
          description: `Potential loop: ${step.type} repeated ${this.config.loop_detection_threshold}+ times`,
          severity: 'error',
          details: {
            type: step.type,
            window_seconds: this.config.loop_detection_window_seconds,
          },
        });
      }

      // Check for cache miss retry
      if (step.type === 'retry' && !step.cache_hit) {
        step.flags.push({
          type: 'cache_miss_retry',
          description: 'Retry occurred without cache hit',
          severity: 'info',
        });
      }

      // Check for error fallback
      if (step.type === 'error') {
        step.flags.push({
          type: 'error_fallback',
          description: 'Error occurred, likely triggered fallback',
          severity: 'error',
          details: {
            summary: step.summary,
          },
        });
      }

      // Check for empty tool output
      if (step.type === 'tool_call' && (!step.tool_output_summary || step.tool_output_summary.trim() === '')) {
        step.flags.push({
          type: 'empty_tool_output',
          description: 'Tool returned empty or no output',
          severity: 'warning',
        });
      }

      result.push(step);
    }

    // Check for prompt mutation (compare consecutive decision prompts)
    this.detectPromptMutation(result);

    return result;
  }

  /**
   * Detect if same-type steps form a loop
   */
  private detectLoop(type: string, timestamps: Date[]): boolean {
    if (timestamps.length < this.config.loop_detection_threshold) {
      return false;
    }

    const windowMs = this.config.loop_detection_window_seconds * 1000;
    const recentTimestamps = timestamps.slice(-this.config.loop_detection_threshold);
    const timeDiff = recentTimestamps[recentTimestamps.length - 1].getTime() - 
                     recentTimestamps[0].getTime();

    return timeDiff <= windowMs;
  }

  /**
   * Detect prompt mutation between consecutive decisions
   */
  private detectPromptMutation(steps: AgentStep[]): void {
    let lastDecisionRaw: string | undefined;

    for (const step of steps) {
      if (step.type === 'decision' && step.raw) {
        if (lastDecisionRaw && lastDecisionRaw !== step.raw) {
          // Check if the change is significant (more than just timestamp changes)
          const similarity = this.computeStringSimilarity(lastDecisionRaw, step.raw);
          if (similarity > 0.3 && similarity < 0.95) {
            step.flags = step.flags ?? [];
            step.flags.push({
              type: 'prompt_mutation',
              description: 'Prompt changed between retries, likely due to dynamic context',
              severity: 'info',
              details: {
                similarity_score: similarity,
              },
            });
          }
        }
        lastDecisionRaw = step.raw;
      }
    }
  }

  /**
   * Simple string similarity for prompt mutation detection
   */
  private computeStringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Simple word overlap similarity
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  /**
   * Generate explanations for steps
   */
  private async generateStepExplanations(steps: AgentStep[]): Promise<AgentStep[]> {
    const result: AgentStep[] = [];

    for (const step of steps) {
      const updatedStep = { ...step };

      // Generate deterministic explanation first
      const deterministicExplanation = this.generateDeterministicExplanation(step);
      
      if (deterministicExplanation.confidence >= this.config.explainer_confidence_threshold) {
        // Use deterministic explanation
        updatedStep.why_explanation = deterministicExplanation.explanation;
        updatedStep.explain_confidence = deterministicExplanation.confidence;
        updatedStep.explain_source = 'deterministic';
        updatedStep.explain_rules_matched = deterministicExplanation.rules_matched;
      } else if (this.config.explainer_enabled) {
        // Fall back to LLM explanation
        try {
          const llmExplanation = await generateExplanation(step, deterministicExplanation);
          updatedStep.why_explanation = llmExplanation.explanation;
          updatedStep.explain_confidence = llmExplanation.confidence;
          updatedStep.explain_source = 'llm';
          updatedStep.explain_rules_matched = deterministicExplanation.rules_matched;
        } catch (error) {
          // Use deterministic even if low confidence
          updatedStep.why_explanation = deterministicExplanation.explanation;
          updatedStep.explain_confidence = deterministicExplanation.confidence;
          updatedStep.explain_source = 'deterministic';
          updatedStep.explain_rules_matched = deterministicExplanation.rules_matched;
        }
      } else {
        // LLM disabled, use deterministic
        updatedStep.why_explanation = deterministicExplanation.explanation;
        updatedStep.explain_confidence = deterministicExplanation.confidence;
        updatedStep.explain_source = 'deterministic';
        updatedStep.explain_rules_matched = deterministicExplanation.rules_matched;
      }

      result.push(updatedStep);
    }

    return result;
  }

  /**
   * Generate deterministic explanation based on rules
   */
  generateDeterministicExplanation(step: AgentStep): ExplanationResult {
    const rules: string[] = [];
    const explanations: string[] = [];

    // Rule: User input starts the flow
    if (step.type === 'user_input') {
      rules.push('user_input_start');
      explanations.push('User initiated the conversation with this input.');
    }

    // Rule: Tool call decision
    if (step.type === 'decision' && step.decision === 'call_tool') {
      rules.push('tool_call_decision');
      explanations.push(`Agent decided to call "${step.tool}" tool to gather information.`);
    }

    // Rule: Direct response decision
    if (step.type === 'decision' && step.decision === 'respond') {
      rules.push('respond_decision');
      explanations.push('Agent decided to respond directly without using tools.');
    }

    // Rule: Tool call execution
    if (step.type === 'tool_call') {
      rules.push('tool_execution');
      explanations.push(`Tool "${step.tool}" was called with the provided arguments.`);
    }

    // Rule: Model response
    if (step.type === 'model_response') {
      rules.push('model_response');
      explanations.push('Model generated a response based on the context.');
    }

    // Rule: Retry with timeout
    if (step.type === 'retry') {
      rules.push('retry_attempt');
      if (step.flags?.some(f => f.type === 'cache_miss_retry')) {
        explanations.push('Agent retried because previous attempt resulted in cache miss.');
      } else {
        explanations.push('Agent retried due to previous step failure or timeout.');
      }
    }

    // Rule: Error occurred
    if (step.type === 'error') {
      rules.push('error_occurred');
      if (step.summary?.toLowerCase().includes('timeout')) {
        explanations.push('Tool timed out, triggering error handling.');
      } else if (step.summary?.toLowerCase().includes('rate limit')) {
        explanations.push('Rate limit exceeded, waiting before retry.');
      } else {
        explanations.push('An error occurred during execution.');
      }
    }

    // Rule: High cost flag
    if (step.flags?.some(f => f.type === 'high_cost_step')) {
      rules.push('high_cost_detected');
      explanations.push('This step has above-average cost.');
    }

    // Rule: Loop detected
    if (step.flags?.some(f => f.type === 'loop_detected')) {
      rules.push('loop_detected');
      explanations.push('Potential infinite loop detected - same action repeated multiple times.');
    }

    // Rule: Cache hit
    if (step.cache_hit) {
      rules.push('cache_hit');
      explanations.push('Result retrieved from cache, saving cost.');
    }

    // Calculate confidence based on rule coverage
    const confidence = rules.length > 0 ? Math.min(0.5 + (rules.length * 0.15), 1.0) : 0.3;

    return {
      explanation: explanations.join(' ') || 'Step executed as part of the agent flow.',
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
      rules_matched: rules,
    };
  }

  /**
   * Build step debug views with computed fields
   */
  private buildStepDebugViews(steps: AgentStep[], totalCost: number): StepDebugView[] {
    return steps.map((step, index) => {
      const prevStep = index > 0 ? steps[index - 1] : null;
      const stepCost = step.api_cost_usd ?? 0;

      return {
        ...step,
        duration_ms: prevStep 
          ? new Date(step.timestamp).getTime() - new Date(prevStep.timestamp).getTime()
          : undefined,
        is_expensive: stepCost >= this.config.high_cost_threshold_usd,
        cost_percentage: totalCost > 0 ? roundPercentage((stepCost / totalCost) * 100) : 0,
      };
    });
  }

  /**
   * Collect all flags from steps
   */
  private collectAllFlags(steps: StepDebugView[]): Flag[] {
    const allFlags: Flag[] = [];
    const seenFlags = new Set<string>();

    for (const step of steps) {
      if (step.flags) {
        for (const flag of step.flags) {
          const key = `${flag.type}-${JSON.stringify(flag.details)}`;
          if (!seenFlags.has(key)) {
            seenFlags.add(key);
            allFlags.push(flag);
          }
        }
      }
    }

    // Sort by severity
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return allFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Build run summary
   */
  private buildRunSummary(
    run: AgentRun,
    cost: CostSummary,
    flags: Flag[],
    stepCount: number
  ): RunSummary {
    const startedAt = new Date(run.started_at);
    const endedAt = run.ended_at ? new Date(run.ended_at) : undefined;
    const durationMs = endedAt ? endedAt.getTime() - startedAt.getTime() : undefined;

    return {
      run_id: run.run_id,
      agent_name: run.agent_name,
      started_at: run.started_at,
      ended_at: run.ended_at,
      status: run.status,
      duration_ms: durationMs,
      total_steps: stepCount,
      cost,
      flags,
      meta: run.meta,
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Round currency to 6 decimal places
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

/**
 * Round percentage to 1 decimal place
 */
export function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Create parser instance with default config
 */
export function createAgentDebugParser(config?: Partial<AgentDebuggerConfig>): AgentDebugParser {
  return new AgentDebugParser(config);
}
