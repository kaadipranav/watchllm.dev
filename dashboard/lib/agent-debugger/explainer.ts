/**
 * Agent Debug Explainer
 * 
 * Generates explanations for agent decisions.
 * Uses deterministic rules first, with optional LLM fallback.
 * 
 * @feature AGENT_DEBUGGER_V1
 */

import { AgentStep } from './types';

// ============================================================================
// Types
// ============================================================================

export interface ExplanationResult {
  explanation: string;
  confidence: number;
  rules_matched: string[];
}

export interface LLMExplanationResult extends ExplanationResult {
  llm_prompt?: string;
  llm_response?: string;
  llm_model?: string;
  explanation_cost_usd?: number;
}

// ============================================================================
// LLM Explanation Generator
// ============================================================================

/**
 * Generate an LLM explanation for a step
 * This is the fallback when deterministic rules have low confidence
 */
export async function generateExplanation(
  step: AgentStep,
  deterministicResult: ExplanationResult
): Promise<LLMExplanationResult> {
  // Build the prompt with deterministic facts
  const facts = buildDeterministicFacts(step, deterministicResult);
  const prompt = buildExplanationPrompt(step, facts);

  // TODO: Replace with actual LLM call using existing infrastructure
  // For now, return a mock response with the deterministic explanation
  // This allows the feature to work without LLM, and can be enabled later
  
  // Mock LLM response for development
  const mockResponse = await mockLLMCall(prompt, step);

  return {
    explanation: mockResponse.explanation,
    confidence: mockResponse.confidence,
    rules_matched: deterministicResult.rules_matched,
    llm_prompt: prompt,
    llm_response: mockResponse.raw_response,
    llm_model: 'gpt-4o-mini', // Will be configurable
    explanation_cost_usd: 0.0001, // Estimate
  };
}

/**
 * Build deterministic facts for the LLM prompt
 */
function buildDeterministicFacts(step: AgentStep, deterministicResult: ExplanationResult): string[] {
  const facts: string[] = [];

  facts.push(`Step type: ${step.type}`);
  
  if (step.tool) {
    facts.push(`Tool used: ${step.tool}`);
  }

  if (step.decision) {
    facts.push(`Decision: ${step.decision}`);
  }

  if (step.api_cost_usd) {
    facts.push(`Cost: $${step.api_cost_usd.toFixed(6)}`);
  }

  if (step.cache_hit !== undefined) {
    facts.push(`Cache hit: ${step.cache_hit}`);
  }

  if (step.flags && step.flags.length > 0) {
    facts.push(`Flags: ${step.flags.map(f => f.type).join(', ')}`);
  }

  if (deterministicResult.rules_matched.length > 0) {
    facts.push(`Rules matched: ${deterministicResult.rules_matched.join(', ')}`);
  }

  return facts;
}

/**
 * Build the LLM prompt for explanation
 */
function buildExplanationPrompt(step: AgentStep, facts: string[]): string {
  return `System: You are an explainability assistant for an AI agent debugger. Your job is to explain why an agent took a specific action in clear, concise language.

Given these deterministic facts about the step:
${facts.map(f => `- ${f}`).join('\n')}

Step summary: ${step.summary || 'No summary available'}

Please provide a concise 1-2 sentence explanation for why the agent performed this action. Focus on the "why" - what triggered this decision and what the expected outcome was.

Also provide a confidence score (0.0 to 1.0) for your explanation based on how certain you are about the reasoning.

Format your response as JSON:
{
  "explanation": "Your explanation here",
  "confidence": 0.85
}`;
}

/**
 * Mock LLM call for development
 * TODO: Replace with actual LLM integration
 */
async function mockLLMCall(
  prompt: string,
  step: AgentStep
): Promise<{ explanation: string; confidence: number; raw_response: string }> {
  // Generate a reasonable mock explanation based on step type
  let explanation: string;
  let confidence: number;

  switch (step.type) {
    case 'user_input':
      explanation = 'The user initiated this interaction with their request, triggering the agent to process and respond.';
      confidence = 0.95;
      break;

    case 'decision':
      if (step.decision === 'call_tool') {
        explanation = `The agent determined it needed external information and chose to call the "${step.tool}" tool to fulfill the user's request.`;
        confidence = 0.88;
      } else {
        explanation = 'The agent analyzed the context and decided on the best course of action to help the user.';
        confidence = 0.75;
      }
      break;

    case 'tool_call':
      explanation = `The agent executed the "${step.tool}" tool with specific parameters to gather necessary information for responding to the user.`;
      confidence = 0.90;
      break;

    case 'tool_result':
      explanation = `The tool returned results that the agent will use to formulate its response.`;
      confidence = 0.92;
      break;

    case 'model_response':
      explanation = 'The agent synthesized all available information to generate this response for the user.';
      confidence = 0.85;
      break;

    case 'retry':
      explanation = 'The previous attempt failed or timed out, so the agent retried the operation to complete the task.';
      confidence = 0.80;
      break;

    case 'error':
      explanation = 'An error occurred during execution, which may have triggered error handling or fallback behavior.';
      confidence = 0.85;
      break;

    default:
      explanation = 'This step was executed as part of the agent\'s normal processing flow.';
      confidence = 0.60;
  }

  // Adjust confidence based on flags
  if (step.flags && step.flags.length > 0) {
    const hasError = step.flags.some(f => f.severity === 'error');
    const hasWarning = step.flags.some(f => f.severity === 'warning');
    
    if (hasError) {
      explanation += ' Note: This step was flagged with potential issues.';
      confidence = Math.max(confidence - 0.1, 0.5);
    } else if (hasWarning) {
      confidence = Math.max(confidence - 0.05, 0.6);
    }
  }

  const raw_response = JSON.stringify({ explanation, confidence }, null, 2);

  return { explanation, confidence, raw_response };
}

/**
 * Validate explanation confidence
 */
export function validateConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Format explanation for display
 */
export function formatExplanation(result: ExplanationResult): string {
  const confidenceLabel = result.confidence >= 0.8 
    ? 'High confidence' 
    : result.confidence >= 0.6 
      ? 'Medium confidence' 
      : 'Low confidence';

  return `${result.explanation} (${confidenceLabel})`;
}
