import { describe, expect, it, vi } from 'vitest';
import { 
  AgentDebugParser, 
  roundCurrency, 
  roundPercentage,
  createAgentDebugParser,
} from '../parser';
import { AgentRun, AgentStep } from '../types';

// Import fixtures
import normalRun from '../fixtures/normal_run.json';
import loopRun from '../fixtures/loop_run.json';
import highCostRun from '../fixtures/high_cost_run.json';

describe('AgentDebugParser', () => {
  describe('roundCurrency', () => {
    it('rounds to 6 decimal places', () => {
      expect(roundCurrency(0.0001234567)).toBe(0.000123);
      expect(roundCurrency(1.999999999)).toBe(2);
      expect(roundCurrency(0)).toBe(0);
    });
  });

  describe('roundPercentage', () => {
    it('rounds to 1 decimal place', () => {
      expect(roundPercentage(12.345)).toBe(12.3);
      expect(roundPercentage(99.99)).toBe(100);
      expect(roundPercentage(0.05)).toBe(0.1);
    });
  });

  describe('parse', () => {
    it('parses normal run correctly', async () => {
      const parser = createAgentDebugParser();
      const result = await parser.parse(normalRun as unknown as AgentRun);

      expect(result.summary.run_id).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(result.summary.agent_name).toBe('order-assistant-v1');
      expect(result.summary.status).toBe('completed');
      expect(result.summary.total_steps).toBe(8);
      expect(result.steps.length).toBe(8);
    });

    it('parses loop run and detects flags', async () => {
      const parser = createAgentDebugParser();
      const result = await parser.parse(loopRun as unknown as AgentRun);

      expect(result.summary.status).toBe('failed');
      expect(result.summary.total_steps).toBe(17);
      
      // Should detect repeated tool calls
      const hasRepeatedToolFlag = result.summary.flags.some(
        f => f.type === 'repeated_tool'
      );
      expect(hasRepeatedToolFlag).toBe(true);
      
      // Should detect empty tool output
      const hasEmptyOutputFlag = result.steps.some(
        s => s.flags?.some(f => f.type === 'empty_tool_output')
      );
      expect(hasEmptyOutputFlag).toBe(true);
    });

    it('parses high cost run and flags expensive steps', async () => {
      const parser = createAgentDebugParser({
        high_cost_threshold_usd: 0.01,
      });
      const result = await parser.parse(highCostRun as unknown as AgentRun);

      expect(result.summary.status).toBe('completed');
      expect(result.summary.cost.total_cost_usd).toBeGreaterThan(0.1);
      
      // Should detect high cost steps
      const highCostSteps = result.steps.filter(s => s.is_expensive);
      expect(highCostSteps.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCostSummary', () => {
    it('calculates total cost correctly', () => {
      const parser = new AgentDebugParser();
      const steps: AgentStep[] = [
        { step_index: 0, timestamp: '2026-01-01T00:00:00Z', type: 'user_input' },
        { step_index: 1, timestamp: '2026-01-01T00:00:01Z', type: 'tool_call', api_cost_usd: 0.001 },
        { step_index: 2, timestamp: '2026-01-01T00:00:02Z', type: 'model_response', api_cost_usd: 0.002 },
      ];

      const summary = parser.calculateCostSummary(steps);
      expect(summary.total_cost_usd).toBe(0.003);
    });

    it('calculates cache hit rate correctly', () => {
      const parser = new AgentDebugParser();
      const steps: AgentStep[] = [
        { step_index: 0, timestamp: '2026-01-01T00:00:00Z', type: 'tool_call', cache_hit: true, api_cost_usd: 0.001 },
        { step_index: 1, timestamp: '2026-01-01T00:00:01Z', type: 'tool_call', cache_hit: false, api_cost_usd: 0.001 },
        { step_index: 2, timestamp: '2026-01-01T00:00:02Z', type: 'tool_call', cache_hit: true, api_cost_usd: 0.001 },
      ];

      const summary = parser.calculateCostSummary(steps);
      expect(summary.cache_hit_rate).toBeCloseTo(66.7, 0);
    });

    it('identifies wasted spend from retries', () => {
      const parser = new AgentDebugParser();
      const steps: AgentStep[] = [
        { step_index: 0, timestamp: '2026-01-01T00:00:00Z', type: 'tool_call', api_cost_usd: 0.001 },
        { step_index: 1, timestamp: '2026-01-01T00:00:01Z', type: 'retry', api_cost_usd: 0.001 },
        { step_index: 2, timestamp: '2026-01-01T00:00:02Z', type: 'retry', api_cost_usd: 0.001 },
      ];

      const summary = parser.calculateCostSummary(steps);
      // Retries and repeated tool calls count as wasted
      expect(summary.wasted_spend_usd).toBeGreaterThan(0);
      expect(summary.breakdown.retries_cost).toBe(0.002);
    });
  });

  describe('detectStepFlags', () => {
    it('detects high cost steps', () => {
      const parser = new AgentDebugParser({ high_cost_threshold_usd: 0.01 });
      const steps: AgentStep[] = [
        { step_index: 0, timestamp: '2026-01-01T00:00:00Z', type: 'tool_call', api_cost_usd: 0.005 },
        { step_index: 1, timestamp: '2026-01-01T00:00:01Z', type: 'tool_call', api_cost_usd: 0.02 },
      ];

      const result = parser.detectStepFlags(steps);
      expect(result[0].flags?.some(f => f.type === 'high_cost_step')).toBe(false);
      expect(result[1].flags?.some(f => f.type === 'high_cost_step')).toBe(true);
    });

    it('detects repeated tool calls', () => {
      const parser = new AgentDebugParser({ repeated_tool_threshold: 3 });
      const steps: AgentStep[] = [
        { step_index: 0, timestamp: '2026-01-01T00:00:00Z', type: 'tool_call', tool: 'search' },
        { step_index: 1, timestamp: '2026-01-01T00:00:01Z', type: 'tool_call', tool: 'search' },
        { step_index: 2, timestamp: '2026-01-01T00:00:02Z', type: 'tool_call', tool: 'search' },
      ];

      const result = parser.detectStepFlags(steps);
      expect(result[2].flags?.some(f => f.type === 'repeated_tool')).toBe(true);
    });

    it('detects empty tool output', () => {
      const parser = new AgentDebugParser();
      const steps: AgentStep[] = [
        { step_index: 0, timestamp: '2026-01-01T00:00:00Z', type: 'tool_call', tool: 'search', tool_output_summary: '' },
        { step_index: 1, timestamp: '2026-01-01T00:00:01Z', type: 'tool_call', tool: 'search', tool_output_summary: 'Found 5 results' },
      ];

      const result = parser.detectStepFlags(steps);
      expect(result[0].flags?.some(f => f.type === 'empty_tool_output')).toBe(true);
      expect(result[1].flags?.some(f => f.type === 'empty_tool_output')).toBe(false);
    });

    it('detects loops within time window', () => {
      const parser = new AgentDebugParser({
        loop_detection_threshold: 3,
        loop_detection_window_seconds: 10,
      });
      const baseTime = new Date('2026-01-01T00:00:00Z');
      const steps: AgentStep[] = [
        { step_index: 0, timestamp: new Date(baseTime.getTime()).toISOString(), type: 'retry' },
        { step_index: 1, timestamp: new Date(baseTime.getTime() + 2000).toISOString(), type: 'retry' },
        { step_index: 2, timestamp: new Date(baseTime.getTime() + 4000).toISOString(), type: 'retry' },
      ];

      const result = parser.detectStepFlags(steps);
      expect(result[2].flags?.some(f => f.type === 'loop_detected')).toBe(true);
    });
  });

  describe('generateDeterministicExplanation', () => {
    it('explains user input', () => {
      const parser = new AgentDebugParser();
      const step: AgentStep = {
        step_index: 0,
        timestamp: '2026-01-01T00:00:00Z',
        type: 'user_input',
        summary: 'User asked a question',
      };

      const result = parser.generateDeterministicExplanation(step);
      expect(result.explanation).toContain('User initiated');
      expect(result.rules_matched).toContain('user_input_start');
      // Confidence is returned as 0-1, should be >= 0.5 for matched rules
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('explains tool call decision', () => {
      const parser = new AgentDebugParser();
      const step: AgentStep = {
        step_index: 1,
        timestamp: '2026-01-01T00:00:01Z',
        type: 'decision',
        decision: 'call_tool',
        tool: 'search_api',
      };

      const result = parser.generateDeterministicExplanation(step);
      expect(result.explanation).toContain('search_api');
      expect(result.rules_matched).toContain('tool_call_decision');
    });

    it('explains retry with flags', () => {
      const parser = new AgentDebugParser();
      const step: AgentStep = {
        step_index: 2,
        timestamp: '2026-01-01T00:00:02Z',
        type: 'retry',
        flags: [{ type: 'cache_miss_retry', description: 'Cache miss', severity: 'info' }],
      };

      const result = parser.generateDeterministicExplanation(step);
      expect(result.explanation).toContain('cache miss');
      expect(result.rules_matched).toContain('retry_attempt');
    });

    it('explains cache hit', () => {
      const parser = new AgentDebugParser();
      const step: AgentStep = {
        step_index: 1,
        timestamp: '2026-01-01T00:00:01Z',
        type: 'tool_call',
        cache_hit: true,
      };

      const result = parser.generateDeterministicExplanation(step);
      expect(result.explanation).toContain('cache');
      expect(result.rules_matched).toContain('cache_hit');
    });
  });
});
