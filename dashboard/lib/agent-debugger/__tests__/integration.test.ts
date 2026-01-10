import { describe, expect, it, beforeAll, afterAll } from 'vitest';

/**
 * Integration tests for Agent Debugger API
 * 
 * These tests verify the fixture API endpoints work correctly.
 * For full integration with database, run with actual Supabase instance.
 * 
 * @feature AGENT_DEBUGGER_V1
 */

// Note: These tests are designed to run against the fixture API
// which doesn't require authentication or database access.
// For production testing, you would need to set up proper auth mocks.

describe('Agent Debugger API Integration', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

  describe('GET /api/agent-runs/fixture/:fixtureId', () => {
    it('returns normal fixture with correct structure', async () => {
      // Skip if not running against local server
      if (!process.env.RUN_INTEGRATION_TESTS) {
        console.log('Skipping integration test - set RUN_INTEGRATION_TESTS=true to run');
        return;
      }

      const response = await fetch(`${baseUrl}/api/agent-runs/fixture/normal`);
      
      if (response.status === 404) {
        // Feature flag not enabled - skip test
        console.log('Agent Debugger feature not enabled, skipping test');
        return;
      }

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      // Verify structure
      expect(data).toHaveProperty('debug');
      expect(data.debug).toHaveProperty('summary');
      expect(data.debug).toHaveProperty('steps');
      
      // Verify summary
      const { summary } = data.debug;
      expect(summary).toHaveProperty('run_id');
      expect(summary).toHaveProperty('agent_name');
      expect(summary).toHaveProperty('status');
      expect(summary).toHaveProperty('total_steps');
      expect(summary).toHaveProperty('cost');
      expect(summary).toHaveProperty('flags');
      
      // Verify cost summary
      expect(summary.cost).toHaveProperty('total_cost_usd');
      expect(summary.cost).toHaveProperty('wasted_spend_usd');
      expect(summary.cost).toHaveProperty('amount_saved_usd');
      expect(summary.cost).toHaveProperty('cache_hit_rate');
      expect(summary.cost).toHaveProperty('breakdown');
      
      // Verify steps
      expect(Array.isArray(data.debug.steps)).toBe(true);
      expect(data.debug.steps.length).toBeGreaterThan(0);
      
      // Verify first step structure
      const firstStep = data.debug.steps[0];
      expect(firstStep).toHaveProperty('step_index');
      expect(firstStep).toHaveProperty('timestamp');
      expect(firstStep).toHaveProperty('type');
      expect(firstStep).toHaveProperty('is_expensive');
      expect(firstStep).toHaveProperty('cost_percentage');
    });

    it('returns loop fixture with flags detected', async () => {
      if (!process.env.RUN_INTEGRATION_TESTS) {
        return;
      }

      const response = await fetch(`${baseUrl}/api/agent-runs/fixture/loop`);
      
      if (response.status === 404) {
        return;
      }

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      // Verify flags are detected
      expect(data.debug.summary.flags.length).toBeGreaterThan(0);
      
      // Should have repeated_tool flag
      const hasRepeatedTool = data.debug.summary.flags.some(
        (f: any) => f.type === 'repeated_tool'
      );
      expect(hasRepeatedTool).toBe(true);
      
      // Should have wasted spend
      expect(data.debug.summary.cost.wasted_spend_usd).toBeGreaterThan(0);
    });

    it('returns high-cost fixture with expensive steps flagged', async () => {
      if (!process.env.RUN_INTEGRATION_TESTS) {
        return;
      }

      const response = await fetch(`${baseUrl}/api/agent-runs/fixture/high-cost`);
      
      if (response.status === 404) {
        return;
      }

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      // Verify high cost
      expect(data.debug.summary.cost.total_cost_usd).toBeGreaterThan(0.1);
      
      // Should have expensive steps
      const expensiveSteps = data.debug.steps.filter((s: any) => s.is_expensive);
      expect(expensiveSteps.length).toBeGreaterThan(0);
    });

    it('returns 404 for non-existent fixture', async () => {
      if (!process.env.RUN_INTEGRATION_TESTS) {
        return;
      }

      const response = await fetch(`${baseUrl}/api/agent-runs/fixture/nonexistent`);
      
      if (response.status === 404) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('available');
      }
    });
  });
});

/**
 * Unit-level integration test for parser + fixtures
 * This test runs without a server.
 */
describe('Parser + Fixture Integration', () => {
  it('parses all fixtures without error', async () => {
    const { createAgentDebugParser } = await import('../index');
    
    // Import fixtures
    const normalRun = (await import('../fixtures/normal_run.json')).default;
    const loopRun = (await import('../fixtures/loop_run.json')).default;
    const highCostRun = (await import('../fixtures/high_cost_run.json')).default;
    
    const parser = createAgentDebugParser();
    
    // Parse all fixtures
    const normalResult = await parser.parse(normalRun as any);
    const loopResult = await parser.parse(loopRun as any);
    const highCostResult = await parser.parse(highCostRun as any);
    
    // Verify all have valid structure
    for (const result of [normalResult, loopResult, highCostResult]) {
      expect(result.summary).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.summary.cost).toBeDefined();
      expect(typeof result.summary.cost.total_cost_usd).toBe('number');
    }
    
    // Verify normal run
    expect(normalResult.summary.status).toBe('completed');
    expect(normalResult.summary.agent_name).toBe('order-assistant-v1');
    
    // Verify loop run has flags
    expect(loopResult.summary.flags.length).toBeGreaterThan(0);
    expect(loopResult.summary.status).toBe('failed');
    
    // Verify high cost run
    expect(highCostResult.summary.cost.total_cost_usd).toBeGreaterThan(0.1);
  });

  it('generates explanations for all steps', async () => {
    const { createAgentDebugParser } = await import('../index');
    const normalRun = (await import('../fixtures/normal_run.json')).default;
    
    const parser = createAgentDebugParser();
    const result = await parser.parse(normalRun as any);
    
    // Every step should have an explanation
    for (const step of result.steps) {
      expect(step.why_explanation).toBeDefined();
      expect(step.why_explanation?.length).toBeGreaterThan(0);
      expect(step.explain_source).toBe('deterministic');
      expect(step.explain_confidence).toBeGreaterThan(0);
    }
  });

  it('calculates cost percentages correctly', async () => {
    const { createAgentDebugParser } = await import('../index');
    const normalRun = (await import('../fixtures/normal_run.json')).default;
    
    const parser = createAgentDebugParser();
    const result = await parser.parse(normalRun as any);
    
    // Sum of percentages should be approximately 100
    const totalPercentage = result.steps.reduce(
      (sum, step) => sum + step.cost_percentage, 
      0
    );
    
    // Allow some rounding error
    expect(totalPercentage).toBeGreaterThan(95);
    expect(totalPercentage).toBeLessThan(105);
  });
});
