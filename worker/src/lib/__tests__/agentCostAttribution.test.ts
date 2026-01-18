/**
 * Agent Cost Attribution Tests
 * 
 * Comprehensive tests for the agent cost attribution and ROI calculation module.
 * 
 * @feature AGENT_COST_ATTRIBUTION
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  groupByAgent,
  groupByRunId,
  groupByAgentAndRun,
  groupRequests,
  calculateRequestMetrics,
  calculateTaskMetrics,
  calculateROI,
  generateROISummary,
  calculateAgentCostSummary,
  compareAgents,
  aggregateByTime,
  AgentCostStore,
  createAgentCostStore,
  DEFAULT_BUSINESS_VALUE_CONFIG,
  type AgentRequest,
  type AgentRun,
  type BusinessValueConfig,
} from '../agentCostAttribution';

// ============================================================================
// Test Data Helpers
// ============================================================================

function createMockRequest(overrides: Partial<AgentRequest> = {}): AgentRequest {
  return {
    runId: 'run-1',
    agentName: 'TestAgent',
    timestamp: '2024-01-15T10:00:00Z',
    model: 'gpt-4o-mini',
    tokensInput: 100,
    tokensOutput: 200,
    costUsd: 0.01,
    potentialCostUsd: 0.01,
    latencyMs: 500,
    cached: false,
    status: 'success',
    ...overrides,
  };
}

function createMockRun(overrides: Partial<AgentRun> = {}): AgentRun {
  return {
    runId: 'run-1',
    agentName: 'TestAgent',
    startedAt: '2024-01-15T10:00:00Z',
    endedAt: '2024-01-15T10:05:00Z',
    status: 'completed',
    totalCostUsd: 0.05,
    stepCount: 5,
    ...overrides,
  };
}

// ============================================================================
// Grouping Tests
// ============================================================================

describe('Request Grouping', () => {
  describe('groupByAgent', () => {
    it('should group requests by agent name', () => {
      const requests = [
        createMockRequest({ agentName: 'Agent1', runId: 'run-1' }),
        createMockRequest({ agentName: 'Agent2', runId: 'run-2' }),
        createMockRequest({ agentName: 'Agent1', runId: 'run-3' }),
      ];

      const result = groupByAgent(requests);

      expect(result.size).toBe(2);
      expect(result.get('Agent1')?.length).toBe(2);
      expect(result.get('Agent2')?.length).toBe(1);
    });

    it('should handle empty array', () => {
      const result = groupByAgent([]);
      expect(result.size).toBe(0);
    });

    it('should use agent name as-is (no transformation)', () => {
      const requests = [
        createMockRequest({ agentName: 'TestAgent', runId: 'run-1' }),
      ];

      const result = groupByAgent(requests);
      expect(result.has('TestAgent')).toBe(true);
      expect(result.get('TestAgent')?.length).toBe(1);
    });
  });

  describe('groupByRunId', () => {
    it('should group requests by run ID', () => {
      const requests = [
        createMockRequest({ runId: 'run-1', agentName: 'Agent1' }),
        createMockRequest({ runId: 'run-1', agentName: 'Agent1' }),
        createMockRequest({ runId: 'run-2', agentName: 'Agent1' }),
      ];

      const result = groupByRunId(requests);

      expect(result.size).toBe(2);
      expect(result.get('run-1')?.length).toBe(2);
      expect(result.get('run-2')?.length).toBe(1);
    });
  });

  describe('groupByAgentAndRun', () => {
    it('should create nested grouping', () => {
      const requests = [
        createMockRequest({ agentName: 'Agent1', runId: 'run-1' }),
        createMockRequest({ agentName: 'Agent1', runId: 'run-2' }),
        createMockRequest({ agentName: 'Agent2', runId: 'run-3' }),
      ];

      const result = groupByAgentAndRun(requests);

      expect(result.size).toBe(2);
      expect(result.get('Agent1')?.size).toBe(2);
      expect(result.get('Agent2')?.size).toBe(1);
    });
  });

  describe('groupRequests', () => {
    it('should return all three groupings', () => {
      const requests = [
        createMockRequest({ agentName: 'Agent1', runId: 'run-1' }),
      ];

      const result = groupRequests(requests);

      expect(result.byAgent).toBeDefined();
      expect(result.byRun).toBeDefined();
      expect(result.byAgentAndRun).toBeDefined();
    });
  });
});

// ============================================================================
// Metrics Calculation Tests
// ============================================================================

describe('Metrics Calculation', () => {
  describe('calculateRequestMetrics', () => {
    it('should calculate basic metrics correctly', () => {
      const requests = [
        createMockRequest({ costUsd: 0.01, latencyMs: 500, tokensInput: 100, tokensOutput: 200 }),
        createMockRequest({ costUsd: 0.02, latencyMs: 600, tokensInput: 150, tokensOutput: 300 }),
      ];

      const result = calculateRequestMetrics(requests);

      expect(result.requestCount).toBe(2);
      expect(result.totalCostUsd).toBe(0.03);
      expect(result.totalLatencyMs).toBe(1100);
      expect(result.avgLatencyMs).toBe(550);
      expect(result.totalTokensInput).toBe(250);
      expect(result.totalTokensOutput).toBe(500);
    });

    it('should calculate cache metrics correctly', () => {
      const requests = [
        createMockRequest({ cached: true, costUsd: 0.001, potentialCostUsd: 0.01 }),
        createMockRequest({ cached: true, costUsd: 0.001, potentialCostUsd: 0.02 }),
        createMockRequest({ cached: false, costUsd: 0.01, potentialCostUsd: 0.01 }),
      ];

      const result = calculateRequestMetrics(requests);

      expect(result.cacheHits).toBe(2);
      expect(result.cacheMisses).toBe(1);
      expect(result.cacheHitRate).toBeCloseTo(66.67, 1);
      // Cost saved = (0.01 - 0.001) + (0.02 - 0.001) = 0.009 + 0.019 = 0.028
      expect(result.costSavedByCaching).toBeCloseTo(0.028, 3);
    });

    it('should count errors correctly', () => {
      const requests = [
        createMockRequest({ status: 'success' }),
        createMockRequest({ status: 'error' }),
        createMockRequest({ status: 'timeout' }),
      ];

      const result = calculateRequestMetrics(requests);

      expect(result.errorCount).toBe(2);
    });

    it('should handle empty array', () => {
      const result = calculateRequestMetrics([]);

      expect(result.requestCount).toBe(0);
      expect(result.totalCostUsd).toBe(0);
      expect(result.avgLatencyMs).toBe(0);
      expect(result.cacheHitRate).toBe(0);
    });
  });

  describe('calculateTaskMetrics', () => {
    it('should count task statuses correctly', () => {
      const runs = [
        createMockRun({ status: 'completed' }),
        createMockRun({ status: 'completed' }),
        createMockRun({ status: 'failed' }),
        createMockRun({ status: 'cancelled' }),
      ];

      const result = calculateTaskMetrics(runs);

      expect(result.taskCount).toBe(4);
      expect(result.successfulTasks).toBe(2);
      expect(result.failedTasks).toBe(2);
      expect(result.successRate).toBe(50);
    });

    it('should calculate duration correctly', () => {
      const runs = [
        createMockRun({
          startedAt: '2024-01-15T10:00:00Z',
          endedAt: '2024-01-15T10:05:00Z', // 5 minutes = 300,000ms
        }),
        createMockRun({
          startedAt: '2024-01-15T11:00:00Z',
          endedAt: '2024-01-15T11:10:00Z', // 10 minutes = 600,000ms
        }),
      ];

      const result = calculateTaskMetrics(runs);

      expect(result.totalTaskDurationMs).toBe(900000);
      expect(result.avgTaskDurationMs).toBe(450000);
    });

    it('should handle empty array', () => {
      const result = calculateTaskMetrics([]);

      expect(result.taskCount).toBe(0);
      expect(result.successRate).toBe(0);
    });
  });
});

// ============================================================================
// ROI Calculation Tests
// ============================================================================

describe('ROI Calculation', () => {
  describe('calculateROI', () => {
    it('should calculate positive ROI correctly', () => {
      const requestMetrics = calculateRequestMetrics([
        createMockRequest({ costUsd: 0.05, cached: true, potentialCostUsd: 0.10 }),
      ]);
      const taskMetrics = calculateTaskMetrics([
        createMockRun({ status: 'completed' }),
        createMockRun({ status: 'completed' }),
      ]);

      const config: BusinessValueConfig = {
        hourlyLaborCost: 50,
        hoursSavedPerTask: 1, // 1 hour per task
        impactMultiplier: 1,
        currency: 'USD',
      };

      const result = calculateROI(requestMetrics, taskMetrics, config);

      // 2 tasks * 1 hour * $50 = $100 labor saved
      // $0.05 caching savings (0.10 - 0.05)
      // Total saved = $100.05
      // Cost = $0.05
      // Net = $100
      expect(result.laborCostSaved).toBe(100);
      expect(result.cachingSavings).toBeCloseTo(0.05, 2);
      expect(result.netSavings).toBeGreaterThan(99);
      expect(result.roiPercentage).toBeGreaterThan(1000); // Very high ROI
    });

    it('should calculate negative ROI (net cost) correctly', () => {
      const requestMetrics = calculateRequestMetrics([
        createMockRequest({ costUsd: 10.00 }), // High cost
      ]);
      const taskMetrics = calculateTaskMetrics([
        createMockRun({ status: 'failed' }),
      ]);

      const result = calculateROI(requestMetrics, taskMetrics);

      // 0 successful tasks = 0 hours saved
      // Cost = $10
      // Net = -$10
      expect(result.laborCostSaved).toBe(0);
      expect(result.netSavings).toBe(-10);
      expect(result.roiPercentage).toBeLessThan(0);
    });

    it('should handle zero cost edge case', () => {
      const requestMetrics = calculateRequestMetrics([]);
      const taskMetrics = calculateTaskMetrics([
        createMockRun({ status: 'completed' }),
      ]);

      const result = calculateROI(requestMetrics, taskMetrics);

      // Cost is 0, so ROI would be infinity if there are savings
      expect(result.totalAgentCostUsd).toBe(0);
    });

    it('should apply impact multiplier', () => {
      const requestMetrics = calculateRequestMetrics([
        createMockRequest({ costUsd: 0.01 }),
      ]);
      const taskMetrics = calculateTaskMetrics([
        createMockRun({ status: 'completed' }),
      ]);

      const config: BusinessValueConfig = {
        hourlyLaborCost: 100,
        hoursSavedPerTask: 1,
        impactMultiplier: 2, // Double impact
        currency: 'USD',
      };

      const result = calculateROI(requestMetrics, taskMetrics, config);

      // 1 task * 1 hour * 2 multiplier * $100 = $200 labor saved
      expect(result.hoursSaved).toBe(2);
      expect(result.laborCostSaved).toBe(200);
    });
  });

  describe('generateROISummary', () => {
    it('should generate human-readable summary', () => {
      const roi = {
        totalAgentCostUsd: 1.50,
        hoursSaved: 2.5,
        laborCostSaved: 125,
        cachingSavings: 0.30,
        netSavings: 123.80,
        roiPercentage: 8253,
      };

      const taskMetrics = {
        taskCount: 5,
        successfulTasks: 5,
        failedTasks: 0,
        successRate: 100,
        avgTaskDurationMs: 60000,
        totalTaskDurationMs: 300000,
      };

      const summary = generateROISummary(roi, DEFAULT_BUSINESS_VALUE_CONFIG, taskMetrics);

      expect(summary).toContain('Completed 5 tasks');
      expect(summary).toContain('Cost: $1.50');
      expect(summary).toContain('Saved 2.5 hours');
      expect(summary).toContain('Caching saved $0.30');
      expect(summary).toContain('Net savings: $123.80');
    });

    it('should format minutes correctly for small time savings', () => {
      const roi = {
        totalAgentCostUsd: 0.10,
        hoursSaved: 0.5, // 30 minutes
        laborCostSaved: 25,
        cachingSavings: 0,
        netSavings: 24.90,
        roiPercentage: 249,
      };

      const taskMetrics = {
        taskCount: 1,
        successfulTasks: 1,
        failedTasks: 0,
        successRate: 100,
        avgTaskDurationMs: 60000,
        totalTaskDurationMs: 60000,
      };

      const summary = generateROISummary(roi, DEFAULT_BUSINESS_VALUE_CONFIG, taskMetrics);

      expect(summary).toContain('30 minutes');
    });
  });
});

// ============================================================================
// Agent Cost Summary Tests
// ============================================================================

describe('Agent Cost Summary', () => {
  describe('calculateAgentCostSummary', () => {
    it('should generate complete summary', () => {
      const requests = [
        createMockRequest({ costUsd: 0.01, runId: 'run-1', timestamp: '2024-01-15T10:00:00Z' }),
        createMockRequest({ costUsd: 0.02, runId: 'run-2', timestamp: '2024-01-16T10:00:00Z' }),
      ];
      const runs = [
        createMockRun({ runId: 'run-1', status: 'completed' }),
        createMockRun({ runId: 'run-2', status: 'completed' }),
      ];

      const result = calculateAgentCostSummary('TestAgent', requests, runs);

      expect(result.agentName).toBe('TestAgent');
      expect(result.runIds).toContain('run-1');
      expect(result.runIds).toContain('run-2');
      expect(result.requestMetrics.requestCount).toBe(2);
      expect(result.taskMetrics.taskCount).toBe(2);
      expect(result.roi.totalAgentCostUsd).toBe(0.03);
    });

    it('should calculate time range from requests', () => {
      const requests = [
        createMockRequest({ timestamp: '2024-01-15T10:00:00Z' }),
        createMockRequest({ timestamp: '2024-01-17T10:00:00Z' }),
      ];

      const result = calculateAgentCostSummary('TestAgent', requests, []);

      expect(result.timeRange.from).toBe('2024-01-15T10:00:00.000Z');
      expect(result.timeRange.to).toBe('2024-01-17T10:00:00.000Z');
    });
  });
});

// ============================================================================
// Agent Comparison Tests
// ============================================================================

describe('Agent Comparison', () => {
  describe('compareAgents', () => {
    it('should aggregate totals across agents', () => {
      const summary1 = calculateAgentCostSummary(
        'Agent1',
        [createMockRequest({ costUsd: 0.05 })],
        [createMockRun({ status: 'completed' })]
      );
      const summary2 = calculateAgentCostSummary(
        'Agent2',
        [createMockRequest({ costUsd: 0.10 })],
        [createMockRun({ status: 'completed' })]
      );

      const result = compareAgents([summary1, summary2]);

      expect(result.agents.length).toBe(2);
      expect(result.totals.totalCostUsd).toBeCloseTo(0.15, 2);
      expect(result.totals.totalTasks).toBe(2);
    });

    it('should identify top performers', () => {
      const highROI = calculateAgentCostSummary(
        'HighROI',
        [createMockRequest({ costUsd: 0.01 })],
        [createMockRun({ status: 'completed' })]
      );
      const lowROI = calculateAgentCostSummary(
        'LowROI',
        [createMockRequest({ costUsd: 1.00 })],
        [createMockRun({ status: 'failed' })]
      );

      const result = compareAgents([highROI, lowROI]);

      expect(result.topPerformers.byROI?.agentName).toBe('HighROI');
    });

    it('should handle empty array', () => {
      const result = compareAgents([]);

      expect(result.agents.length).toBe(0);
      expect(result.totals.totalCostUsd).toBe(0);
      expect(result.topPerformers.byROI).toBeNull();
    });
  });
});

// ============================================================================
// Time-based Aggregation Tests
// ============================================================================

describe('Time-based Aggregation', () => {
  describe('aggregateByTime', () => {
    it('should aggregate by hour', () => {
      const requests = [
        createMockRequest({ timestamp: '2024-01-15T10:15:00Z', costUsd: 0.01 }),
        createMockRequest({ timestamp: '2024-01-15T10:30:00Z', costUsd: 0.02 }),
        createMockRequest({ timestamp: '2024-01-15T11:15:00Z', costUsd: 0.03 }),
      ];

      const result = aggregateByTime(requests, [], 'hour');

      expect(result.length).toBe(2);
      expect(result[0].cost).toBeCloseTo(0.03, 2); // 10:00 bucket
      expect(result[1].cost).toBeCloseTo(0.03, 2); // 11:00 bucket
    });

    it('should aggregate by day', () => {
      const requests = [
        createMockRequest({ timestamp: '2024-01-15T10:00:00Z', costUsd: 0.01 }),
        createMockRequest({ timestamp: '2024-01-15T22:00:00Z', costUsd: 0.02 }),
        createMockRequest({ timestamp: '2024-01-16T10:00:00Z', costUsd: 0.03 }),
      ];

      const result = aggregateByTime(requests, [], 'day');

      expect(result.length).toBe(2);
      expect(result[0].cost).toBeCloseTo(0.03, 2); // Jan 15
      expect(result[1].cost).toBeCloseTo(0.03, 2); // Jan 16
    });

    it('should count cache hits and errors', () => {
      const requests = [
        createMockRequest({ timestamp: '2024-01-15T10:00:00Z', cached: true, status: 'success' }),
        createMockRequest({ timestamp: '2024-01-15T10:00:00Z', cached: false, status: 'error' }),
      ];

      const result = aggregateByTime(requests, [], 'day');

      expect(result[0].cacheHits).toBe(1);
      expect(result[0].errors).toBe(1);
    });

    it('should sort results chronologically', () => {
      const requests = [
        createMockRequest({ timestamp: '2024-01-17T10:00:00Z' }),
        createMockRequest({ timestamp: '2024-01-15T10:00:00Z' }),
        createMockRequest({ timestamp: '2024-01-16T10:00:00Z' }),
      ];

      const result = aggregateByTime(requests, [], 'day');

      expect(result.length).toBe(3);
      expect(new Date(result[0].timestamp).getTime()).toBeLessThan(
        new Date(result[1].timestamp).getTime()
      );
    });
  });
});

// ============================================================================
// AgentCostStore Tests
// ============================================================================

describe('AgentCostStore', () => {
  let store: AgentCostStore;

  beforeEach(() => {
    store = createAgentCostStore();
  });

  describe('addRequest / addRequests', () => {
    it('should add individual requests', () => {
      store.addRequest(createMockRequest());
      expect(store.getStats().requestCount).toBe(1);
    });

    it('should add multiple requests', () => {
      store.addRequests([
        createMockRequest(),
        createMockRequest(),
      ]);
      expect(store.getStats().requestCount).toBe(2);
    });
  });

  describe('addRun', () => {
    it('should add runs', () => {
      store.addRun(createMockRun());
      expect(store.getStats().runCount).toBe(1);
    });
  });

  describe('setBusinessValueConfig / getBusinessValueConfig', () => {
    it('should set and get custom config', () => {
      const customConfig: BusinessValueConfig = {
        hourlyLaborCost: 100,
        hoursSavedPerTask: 2,
        impactMultiplier: 1.5,
        currency: 'EUR',
      };

      store.setBusinessValueConfig('TestAgent', customConfig);
      const result = store.getBusinessValueConfig('TestAgent');

      expect(result.hourlyLaborCost).toBe(100);
      expect(result.currency).toBe('EUR');
    });

    it('should return default config for unknown agents', () => {
      const result = store.getBusinessValueConfig('UnknownAgent');
      expect(result).toEqual(DEFAULT_BUSINESS_VALUE_CONFIG);
    });
  });

  describe('getAgentSummary', () => {
    it('should calculate summary for specific agent', () => {
      store.addRequests([
        createMockRequest({ agentName: 'Agent1', costUsd: 0.01 }),
        createMockRequest({ agentName: 'Agent1', costUsd: 0.02 }),
        createMockRequest({ agentName: 'Agent2', costUsd: 0.05 }),
      ]);
      store.addRun(createMockRun({ agentName: 'Agent1' }));

      const result = store.getAgentSummary('Agent1');

      expect(result.agentName).toBe('Agent1');
      expect(result.requestMetrics.requestCount).toBe(2);
      expect(result.requestMetrics.totalCostUsd).toBeCloseTo(0.03, 2);
    });
  });

  describe('getAllAgentSummaries', () => {
    it('should return summaries for all agents', () => {
      store.addRequests([
        createMockRequest({ agentName: 'Agent1' }),
        createMockRequest({ agentName: 'Agent2' }),
        createMockRequest({ agentName: 'Agent3' }),
      ]);

      const result = store.getAllAgentSummaries();

      expect(result.length).toBe(3);
    });
  });

  describe('getAgentComparison', () => {
    it('should return comparison across all agents', () => {
      store.addRequests([
        createMockRequest({ agentName: 'Agent1', costUsd: 0.01 }),
        createMockRequest({ agentName: 'Agent2', costUsd: 0.02 }),
      ]);

      const result = store.getAgentComparison();

      expect(result.agents.length).toBe(2);
      expect(result.totals.totalCostUsd).toBe(0.03);
    });
  });

  describe('getTimeSeries', () => {
    it('should return time series for specific agent', () => {
      store.addRequests([
        createMockRequest({ agentName: 'Agent1', timestamp: '2024-01-15T10:00:00Z' }),
        createMockRequest({ agentName: 'Agent1', timestamp: '2024-01-16T10:00:00Z' }),
        createMockRequest({ agentName: 'Agent2', timestamp: '2024-01-15T10:00:00Z' }),
      ]);

      const result = store.getTimeSeries('Agent1', 'day');

      expect(result.length).toBe(2);
    });
  });

  describe('getRunRequests', () => {
    it('should filter requests by run ID', () => {
      store.addRequests([
        createMockRequest({ runId: 'run-1' }),
        createMockRequest({ runId: 'run-1' }),
        createMockRequest({ runId: 'run-2' }),
      ]);

      const result = store.getRunRequests('run-1');

      expect(result.length).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all data', () => {
      store.addRequests([createMockRequest()]);
      store.addRun(createMockRun());

      store.clear();

      expect(store.getStats().requestCount).toBe(0);
      expect(store.getStats().runCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      store.addRequests([
        createMockRequest({ agentName: 'Agent1' }),
        createMockRequest({ agentName: 'Agent1' }),
        createMockRequest({ agentName: 'Agent2' }),
      ]);
      store.addRun(createMockRun());
      store.addRun(createMockRun());

      const stats = store.getStats();

      expect(stats.requestCount).toBe(3);
      expect(stats.runCount).toBe(2);
      expect(stats.agentCount).toBe(2);
    });
  });
});
