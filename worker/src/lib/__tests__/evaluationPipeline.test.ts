/**
 * Custom Evaluation Pipeline Tests
 * 
 * Tests for:
 * - Evaluation criteria (regex, contains, json, thresholds, etc.)
 * - Rule set evaluation
 * - Async queue processing
 * - Alert threshold checking
 * - ClickHouse integration
 * 
 * @feature CUSTOM_EVALUATION
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Types
  type EvaluationCriterion,
  type EvaluationRuleSet,
  type EvaluationInput,
  type EvaluationResult,
  type AlertConfig,
  // Core functions
  evaluateCriterion,
  evaluateRuleSet,
  matchesFilter,
  shouldSample,
  // Alert functions
  checkAlertThreshold,
  createEvaluationAlertSlackMessage,
  // ClickHouse functions
  toClickHouseRow,
  fromClickHouseRow,
  generateClickHouseInsert,
  // Stores
  RuleSetStore,
  ResultStore,
  EvaluationQueue,
  // Factory functions
  createRegexCriterion,
  createContainsCriterion,
  createLatencyCriterion,
  createCostCriterion,
  createRuleSet,
} from '../evaluationPipeline';

// ============================================================================
// Test Fixtures
// ============================================================================

const createTestInput = (overrides: Partial<EvaluationInput> = {}): EvaluationInput => ({
  requestId: 'req_test_123',
  projectId: 'proj_test_456',
  model: 'gpt-4',
  path: '/v1/chat/completions',
  input: 'What is the capital of France?',
  output: 'The capital of France is Paris.',
  latencyMs: 500,
  cost: 0.05,
  requestedAt: new Date().toISOString(),
  ...overrides,
});

// ============================================================================
// Criterion Evaluation Tests
// ============================================================================

describe('Evaluation Criteria', () => {
  describe('regex_match', () => {
    it('should pass when pattern matches', async () => {
      const criterion = createRegexCriterion('JSON format', '^\\{.*\\}$', { flags: 's' });
      const input = createTestInput({ output: '{"result": "success"}' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(1);
    });

    it('should fail when pattern does not match', async () => {
      const criterion = createRegexCriterion('JSON format', '^\\{.*\\}$');
      const input = createTestInput({ output: 'Just plain text' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should handle regex flags', async () => {
      const criterion = createRegexCriterion('Case insensitive', 'paris', { flags: 'i' });
      const input = createTestInput({ output: 'The capital is PARIS' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });
  });

  describe('contains', () => {
    it('should pass when substring is found', async () => {
      const criterion = createContainsCriterion('Contains Paris', 'Paris');
      const input = createTestInput({ output: 'The capital of France is Paris.' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(1);
    });

    it('should fail when substring is not found', async () => {
      const criterion = createContainsCriterion('Contains London', 'London');
      const input = createTestInput({ output: 'The capital of France is Paris.' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should handle case sensitivity', async () => {
      const caseSensitive = createContainsCriterion('Case sensitive', 'PARIS', { caseSensitive: true });
      const caseInsensitive = createContainsCriterion('Case insensitive', 'PARIS', { caseSensitive: false });
      const input = createTestInput({ output: 'The capital is Paris' });
      
      const sensitiveResult = await evaluateCriterion(caseSensitive, input);
      const insensitiveResult = await evaluateCriterion(caseInsensitive, input);
      
      expect(sensitiveResult.passed).toBe(false);
      expect(insensitiveResult.passed).toBe(true);
    });
  });

  describe('not_contains', () => {
    it('should pass when unwanted substring is not found', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'No errors',
        type: 'not_contains',
        config: { type: 'contains', substring: 'error' },
        weight: 1,
        severity: 'warning',
        enabled: true,
      };
      const input = createTestInput({ output: 'Success! Everything is working.' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });

    it('should fail when unwanted substring is found', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'No errors',
        type: 'not_contains',
        config: { type: 'contains', substring: 'error' },
        weight: 1,
        severity: 'warning',
        enabled: true,
      };
      const input = createTestInput({ output: 'There was an error processing your request.' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
    });
  });

  describe('json_schema', () => {
    it('should pass for valid JSON matching schema', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'Valid JSON',
        type: 'json_schema',
        config: { 
          type: 'json_schema', 
          schema: { type: 'object', required: ['result'], properties: { result: { type: 'string' } } } 
        },
        weight: 1,
        severity: 'error',
        enabled: true,
      };
      const input = createTestInput({ output: '{"result": "success"}' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });

    it('should fail for invalid JSON', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'Valid JSON',
        type: 'json_schema',
        config: { type: 'json_schema', schema: { type: 'object' } },
        weight: 1,
        severity: 'error',
        enabled: true,
      };
      const input = createTestInput({ output: 'not json' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
      expect(result.message).toContain('not valid JSON');
    });
  });

  describe('json_path_exists', () => {
    it('should pass when path exists', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'Has result field',
        type: 'json_path_exists',
        config: { type: 'json_path', path: 'data.result' },
        weight: 1,
        severity: 'warning',
        enabled: true,
      };
      const input = createTestInput({ 
        output: '{"data": {"result": "value"}}',
        responseBody: { data: { result: 'value' } },
      });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });

    it('should fail when path does not exist', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'Has missing field',
        type: 'json_path_exists',
        config: { type: 'json_path', path: 'data.missing' },
        weight: 1,
        severity: 'warning',
        enabled: true,
      };
      const input = createTestInput({ 
        responseBody: { data: { result: 'value' } },
      });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
    });
  });

  describe('length thresholds', () => {
    it('should pass length_min when length is sufficient', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'Min length 10',
        type: 'length_min',
        config: { type: 'length', min: 10 },
        weight: 1,
        severity: 'warning',
        enabled: true,
      };
      const input = createTestInput({ output: 'This is a long enough response.' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });

    it('should fail length_min when length is too short', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'Min length 100',
        type: 'length_min',
        config: { type: 'length', min: 100 },
        weight: 1,
        severity: 'warning',
        enabled: true,
      };
      const input = createTestInput({ output: 'Short' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
    });

    it('should pass length_max when length is within limit', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'Max length 1000',
        type: 'length_max',
        config: { type: 'length', max: 1000 },
        weight: 1,
        severity: 'warning',
        enabled: true,
      };
      const input = createTestInput({ output: 'Short response' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });
  });

  describe('latency_max', () => {
    it('should pass when latency is below threshold', async () => {
      const criterion = createLatencyCriterion('Fast response', 1000);
      const input = createTestInput({ latencyMs: 500 });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(1);
    });

    it('should fail when latency exceeds threshold', async () => {
      const criterion = createLatencyCriterion('Fast response', 1000);
      const input = createTestInput({ latencyMs: 2000 });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(1);
    });
  });

  describe('cost_max', () => {
    it('should pass when cost is below threshold', async () => {
      const criterion = createCostCriterion('Budget limit', 0.10);
      const input = createTestInput({ cost: 0.05 });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });

    it('should fail when cost exceeds threshold', async () => {
      const criterion = createCostCriterion('Budget limit', 0.10);
      const input = createTestInput({ cost: 0.15 });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
    });
  });

  describe('sentiment', () => {
    it('should detect positive sentiment', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'Positive response',
        type: 'sentiment',
        config: { type: 'sentiment', expectedSentiment: 'positive' },
        weight: 1,
        severity: 'warning',
        enabled: true,
      };
      const input = createTestInput({ output: 'This is great! I love how helpful and amazing this is!' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });

    it('should detect negative sentiment', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'Negative detection',
        type: 'sentiment',
        config: { type: 'sentiment', expectedSentiment: 'negative' },
        weight: 1,
        severity: 'warning',
        enabled: true,
      };
      const input = createTestInput({ output: 'This is terrible and awful. I hate it.' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });
  });

  describe('toxicity', () => {
    it('should pass when no toxic content detected', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'No toxicity',
        type: 'toxicity',
        config: { type: 'sentiment', expectedSentiment: 'neutral' }, // Config not used
        weight: 1,
        severity: 'critical',
        enabled: true,
      };
      const input = createTestInput({ output: 'Here is a helpful and polite response.' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });
  });

  describe('pii_detection', () => {
    it('should detect email PII', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'No PII',
        type: 'pii_detection',
        config: { type: 'sentiment', expectedSentiment: 'neutral' }, // Config not used
        weight: 1,
        severity: 'critical',
        enabled: true,
      };
      const input = createTestInput({ output: 'Contact me at john@example.com' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
      expect(result.details?.piiTypes).toContain('email');
    });

    it('should detect phone PII', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'No PII',
        type: 'pii_detection',
        config: { type: 'sentiment', expectedSentiment: 'neutral' },
        weight: 1,
        severity: 'critical',
        enabled: true,
      };
      const input = createTestInput({ output: 'Call me at 555-123-4567' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(false);
      expect(result.details?.piiTypes).toContain('phone');
    });

    it('should pass when no PII detected', async () => {
      const criterion: EvaluationCriterion = {
        id: 'crit_1',
        name: 'No PII',
        type: 'pii_detection',
        config: { type: 'sentiment', expectedSentiment: 'neutral' },
        weight: 1,
        severity: 'critical',
        enabled: true,
      };
      const input = createTestInput({ output: 'The capital of France is Paris.' });
      
      const result = await evaluateCriterion(criterion, input);
      expect(result.passed).toBe(true);
    });
  });
});

// ============================================================================
// Rule Set Evaluation Tests
// ============================================================================

describe('Rule Set Evaluation', () => {
  it('should evaluate all criteria in a rule set', async () => {
    const ruleSet = createRuleSet('proj_1', 'Test Rules', [
      createContainsCriterion('Contains France', 'France'),
      createContainsCriterion('Contains Paris', 'Paris'),
      createLatencyCriterion('Fast response', 1000),
    ]);
    
    const input = createTestInput({
      output: 'France has its capital in Paris.',
      latencyMs: 500,
    });

    const result = await evaluateRuleSet(ruleSet, input);
    
    expect(result.passed).toBe(true);
    expect(result.totalCount).toBe(3);
    expect(result.passedCount).toBe(3);
    expect(result.failedCount).toBe(0);
    expect(result.score).toBe(1);
  });

  it('should fail when any criterion fails', async () => {
    const ruleSet = createRuleSet('proj_1', 'Test Rules', [
      createContainsCriterion('Contains France', 'France'),
      createContainsCriterion('Contains London', 'London'), // Will fail
      createLatencyCriterion('Fast response', 1000),
    ]);
    
    const input = createTestInput({
      output: 'France has its capital in Paris.',
      latencyMs: 500,
    });

    const result = await evaluateRuleSet(ruleSet, input);
    
    expect(result.passed).toBe(false);
    expect(result.passedCount).toBe(2);
    expect(result.failedCount).toBe(1);
  });

  it('should skip disabled criteria', async () => {
    const criteria = [
      createContainsCriterion('Enabled', 'France'),
      { ...createContainsCriterion('Disabled', 'London'), enabled: false },
    ];
    const ruleSet = createRuleSet('proj_1', 'Test Rules', criteria);
    
    const input = createTestInput({ output: 'France' });

    const result = await evaluateRuleSet(ruleSet, input);
    
    expect(result.totalCount).toBe(1); // Only enabled criterion
    expect(result.passed).toBe(true);
  });

  it('should track max severity of failures', async () => {
    const criteria = [
      { ...createContainsCriterion('Info fail', 'missing1'), severity: 'info' as const },
      { ...createContainsCriterion('Error fail', 'missing2'), severity: 'error' as const },
      { ...createContainsCriterion('Warning fail', 'missing3'), severity: 'warning' as const },
    ];
    const ruleSet = createRuleSet('proj_1', 'Test Rules', criteria);
    
    const input = createTestInput({ output: 'no matches' });

    const result = await evaluateRuleSet(ruleSet, input);
    
    expect(result.maxSeverity).toBe('error');
  });
});

// ============================================================================
// Filter Tests
// ============================================================================

describe('Request Filter', () => {
  describe('matchesFilter', () => {
    it('should match when no filters are set', () => {
      const input = createTestInput();
      expect(matchesFilter({}, input)).toBe(true);
    });

    it('should filter by model', () => {
      const input = createTestInput({ model: 'gpt-4' });
      
      expect(matchesFilter({ models: ['gpt-4'] }, input)).toBe(true);
      expect(matchesFilter({ models: ['gpt-3.5-turbo'] }, input)).toBe(false);
      expect(matchesFilter({ models: ['gpt-4', 'gpt-3.5-turbo'] }, input)).toBe(true);
    });

    it('should filter by agent name', () => {
      const input = createTestInput({ agentName: 'MyAgent' });
      
      expect(matchesFilter({ agentNames: ['MyAgent'] }, input)).toBe(true);
      expect(matchesFilter({ agentNames: ['OtherAgent'] }, input)).toBe(false);
    });

    it('should filter by path', () => {
      const input = createTestInput({ path: '/v1/chat/completions' });
      
      expect(matchesFilter({ paths: ['/v1/chat'] }, input)).toBe(true);
      expect(matchesFilter({ paths: ['/v1/embeddings'] }, input)).toBe(false);
    });

    it('should filter by tags', () => {
      const input = createTestInput({ tags: ['production', 'critical'] });
      
      expect(matchesFilter({ tags: ['production'] }, input)).toBe(true);
      expect(matchesFilter({ tags: ['staging'] }, input)).toBe(false);
    });

    it('should filter by minimum cost', () => {
      const input = createTestInput({ cost: 0.05 });
      
      expect(matchesFilter({ minCost: 0.01 }, input)).toBe(true);
      expect(matchesFilter({ minCost: 0.10 }, input)).toBe(false);
    });
  });

  describe('shouldSample', () => {
    it('should always sample at rate 1.0', () => {
      for (let i = 0; i < 100; i++) {
        expect(shouldSample(1.0)).toBe(true);
      }
    });

    it('should never sample at rate 0.0', () => {
      for (let i = 0; i < 100; i++) {
        expect(shouldSample(0.0)).toBe(false);
      }
    });

    it('should sample approximately at the given rate', () => {
      let sampled = 0;
      const iterations = 10000;
      const rate = 0.5;
      
      for (let i = 0; i < iterations; i++) {
        if (shouldSample(rate)) sampled++;
      }
      
      const actualRate = sampled / iterations;
      expect(actualRate).toBeGreaterThan(0.45);
      expect(actualRate).toBeLessThan(0.55);
    });
  });
});

// ============================================================================
// Alert System Tests
// ============================================================================

describe('Alert System', () => {
  describe('checkAlertThreshold', () => {
    const createResult = (passed: boolean, evaluatedAt: Date): EvaluationResult => ({
      id: `eval_${Date.now()}`,
      projectId: 'proj_1',
      ruleSetId: 'rs_1',
      requestId: 'req_1',
      model: 'gpt-4',
      passed,
      score: passed ? 1 : 0,
      criteriaResults: [],
      passedCount: passed ? 1 : 0,
      failedCount: passed ? 0 : 1,
      totalCount: 1,
      requestPath: '/v1/chat',
      requestLatencyMs: 100,
      requestCost: 0.01,
      evaluatedAt: evaluatedAt.toISOString(),
      requestedAt: evaluatedAt.toISOString(),
      evaluationDurationMs: 10,
    });

    const baseAlertConfig: AlertConfig = {
      enabled: true,
      passRateThreshold: 0.8,
      windowMinutes: 60,
      minSamples: 5,
      channels: [],
      cooldownMinutes: 15,
    };

    it('should not alert when disabled', () => {
      const config = { ...baseAlertConfig, enabled: false };
      const results = [createResult(false, new Date())];
      
      const check = checkAlertThreshold(config, results);
      expect(check.shouldAlert).toBe(false);
    });

    it('should not alert when below minimum samples', () => {
      const now = new Date();
      const results = [
        createResult(false, now),
        createResult(false, now),
      ];
      
      const check = checkAlertThreshold(baseAlertConfig, results, now);
      expect(check.shouldAlert).toBe(false);
      expect(check.sampleCount).toBe(2);
    });

    it('should alert when pass rate drops below threshold', () => {
      const now = new Date();
      const results = [
        createResult(true, now),
        createResult(true, now),
        createResult(false, now),
        createResult(false, now),
        createResult(false, now),
      ];
      
      const check = checkAlertThreshold(baseAlertConfig, results, now);
      expect(check.shouldAlert).toBe(true);
      expect(check.passRate).toBe(0.4);
    });

    it('should not alert when pass rate is above threshold', () => {
      const now = new Date();
      const results = [
        createResult(true, now),
        createResult(true, now),
        createResult(true, now),
        createResult(true, now),
        createResult(false, now),
      ];
      
      const check = checkAlertThreshold(baseAlertConfig, results, now);
      expect(check.shouldAlert).toBe(false);
      expect(check.passRate).toBe(0.8);
    });

    it('should respect cooldown period', () => {
      const now = new Date();
      const results = [
        createResult(false, now),
        createResult(false, now),
        createResult(false, now),
        createResult(false, now),
        createResult(false, now),
      ];
      
      const configWithRecentAlert = {
        ...baseAlertConfig,
        lastAlertAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 mins ago
      };
      
      const check = checkAlertThreshold(configWithRecentAlert, results, now);
      expect(check.shouldAlert).toBe(false);
    });

    it('should filter results outside window', () => {
      const now = new Date();
      const oldResult = createResult(false, new Date(now.getTime() - 2 * 60 * 60 * 1000)); // 2 hours ago
      const recentResults = [
        createResult(true, now),
        createResult(true, now),
        createResult(true, now),
        createResult(true, now),
        createResult(true, now),
      ];
      
      const check = checkAlertThreshold(baseAlertConfig, [oldResult, ...recentResults], now);
      expect(check.sampleCount).toBe(5); // Old result filtered out
      expect(check.passRate).toBe(1);
    });
  });

  describe('createEvaluationAlertSlackMessage', () => {
    it('should create a properly formatted message', () => {
      const message = createEvaluationAlertSlackMessage(
        'Quality Checks',
        0.65,
        0.80,
        100,
        'https://watchllm.com'
      );

      expect(message.blocks).toBeDefined();
      expect(message.blocks.length).toBeGreaterThan(0);
      expect(message.blocks[0].type).toBe('header');
    });
  });
});

// ============================================================================
// ClickHouse Integration Tests
// ============================================================================

describe('ClickHouse Integration', () => {
  describe('toClickHouseRow / fromClickHouseRow', () => {
    it('should convert result to row and back', () => {
      const original: EvaluationResult = {
        id: 'eval_123',
        projectId: 'proj_456',
        ruleSetId: 'rs_789',
        requestId: 'req_abc',
        runId: 'run_def',
        agentName: 'TestAgent',
        model: 'gpt-4',
        passed: true,
        score: 0.95,
        criteriaResults: [
          {
            criterionId: 'crit_1',
            criterionName: 'Test',
            type: 'contains',
            passed: true,
            score: 1,
            message: 'Passed',
            durationMs: 5,
          },
        ],
        passedCount: 1,
        failedCount: 0,
        totalCount: 1,
        maxSeverity: 'info',
        requestPath: '/v1/chat',
        requestLatencyMs: 500,
        requestCost: 0.05,
        evaluatedAt: '2024-01-15T10:00:00Z',
        requestedAt: '2024-01-15T09:59:59Z',
        evaluationDurationMs: 10,
      };

      const row = toClickHouseRow(original);
      const restored = fromClickHouseRow(row);

      expect(restored.id).toBe(original.id);
      expect(restored.projectId).toBe(original.projectId);
      expect(restored.passed).toBe(original.passed);
      expect(restored.score).toBe(original.score);
      expect(restored.criteriaResults).toEqual(original.criteriaResults);
    });

    it('should handle undefined optional fields', () => {
      const result: EvaluationResult = {
        id: 'eval_123',
        projectId: 'proj_456',
        ruleSetId: 'rs_789',
        requestId: 'req_abc',
        model: 'gpt-4',
        passed: true,
        score: 1,
        criteriaResults: [],
        passedCount: 0,
        failedCount: 0,
        totalCount: 0,
        requestPath: '/v1/chat',
        requestLatencyMs: 100,
        requestCost: 0.01,
        evaluatedAt: new Date().toISOString(),
        requestedAt: new Date().toISOString(),
        evaluationDurationMs: 5,
      };

      const row = toClickHouseRow(result);
      expect(row.run_id).toBe('');
      expect(row.agent_name).toBe('');
      expect(row.max_severity).toBe('');
    });
  });

  describe('generateClickHouseInsert', () => {
    it('should generate valid INSERT statement', () => {
      const results: EvaluationResult[] = [
        {
          id: 'eval_1',
          projectId: 'proj_1',
          ruleSetId: 'rs_1',
          requestId: 'req_1',
          model: 'gpt-4',
          passed: true,
          score: 1,
          criteriaResults: [],
          passedCount: 1,
          failedCount: 0,
          totalCount: 1,
          requestPath: '/v1/chat',
          requestLatencyMs: 100,
          requestCost: 0.01,
          evaluatedAt: '2024-01-15T10:00:00Z',
          requestedAt: '2024-01-15T09:59:59Z',
          evaluationDurationMs: 5,
        },
      ];

      const sql = generateClickHouseInsert(results);
      
      expect(sql).toContain('INSERT INTO evaluation_results');
      expect(sql).toContain('eval_1');
      expect(sql).toContain('proj_1');
    });
  });
});

// ============================================================================
// Store Tests
// ============================================================================

describe('RuleSetStore', () => {
  let store: RuleSetStore;

  beforeEach(() => {
    store = new RuleSetStore();
  });

  it('should add and retrieve rule sets', () => {
    const ruleSet = createRuleSet('proj_1', 'Test Rules', []);
    store.add(ruleSet);

    expect(store.get(ruleSet.id)).toEqual(ruleSet);
    expect(store.getSize()).toBe(1);
  });

  it('should get rule sets by project', () => {
    const rs1 = createRuleSet('proj_1', 'Rules 1', []);
    const rs2 = createRuleSet('proj_1', 'Rules 2', []);
    const rs3 = createRuleSet('proj_2', 'Rules 3', []);

    store.add(rs1);
    store.add(rs2);
    store.add(rs3);

    const proj1Rules = store.getByProject('proj_1');
    expect(proj1Rules).toHaveLength(2);
  });

  it('should update rule sets', () => {
    const ruleSet = createRuleSet('proj_1', 'Original Name', []);
    store.add(ruleSet);

    const success = store.update(ruleSet.id, { name: 'Updated Name' });
    expect(success).toBe(true);
    expect(store.get(ruleSet.id)?.name).toBe('Updated Name');
    expect(store.get(ruleSet.id)?.updatedAt).toBeDefined();
  });

  it('should delete rule sets', () => {
    const ruleSet = createRuleSet('proj_1', 'Test', []);
    store.add(ruleSet);

    const success = store.delete(ruleSet.id);
    expect(success).toBe(true);
    expect(store.get(ruleSet.id)).toBeUndefined();
  });
});

describe('ResultStore', () => {
  let store: ResultStore;

  beforeEach(() => {
    store = new ResultStore(100);
  });

  const createStoredResult = (overrides: Partial<EvaluationResult> = {}): EvaluationResult => ({
    id: `eval_${Date.now()}_${Math.random()}`,
    projectId: 'proj_1',
    ruleSetId: 'rs_1',
    requestId: 'req_1',
    model: 'gpt-4',
    passed: true,
    score: 1,
    criteriaResults: [],
    passedCount: 1,
    failedCount: 0,
    totalCount: 1,
    requestPath: '/v1/chat',
    requestLatencyMs: 100,
    requestCost: 0.01,
    evaluatedAt: new Date().toISOString(),
    requestedAt: new Date().toISOString(),
    evaluationDurationMs: 5,
    ...overrides,
  });

  it('should add and retrieve results', () => {
    const result = createStoredResult();
    store.add(result);

    expect(store.get(result.id)).toEqual(result);
    expect(store.getSize()).toBe(1);
  });

  it('should get results by project', () => {
    store.add(createStoredResult({ id: 'r1', projectId: 'proj_1' }));
    store.add(createStoredResult({ id: 'r2', projectId: 'proj_1' }));
    store.add(createStoredResult({ id: 'r3', projectId: 'proj_2' }));

    const proj1Results = store.getByProject('proj_1');
    expect(proj1Results).toHaveLength(2);
  });

  it('should get results by rule set', () => {
    store.add(createStoredResult({ id: 'r1', ruleSetId: 'rs_1' }));
    store.add(createStoredResult({ id: 'r2', ruleSetId: 'rs_1' }));
    store.add(createStoredResult({ id: 'r3', ruleSetId: 'rs_2' }));

    const rs1Results = store.getByRuleSet('rs_1');
    expect(rs1Results).toHaveLength(2);
  });

  it('should calculate metrics correctly', () => {
    store.add(createStoredResult({ id: 'r1', passed: true, score: 1 }));
    store.add(createStoredResult({ id: 'r2', passed: true, score: 0.8 }));
    store.add(createStoredResult({ id: 'r3', passed: false, score: 0.3 }));

    const metrics = store.getMetrics('proj_1');
    expect(metrics.totalEvaluations).toBe(3);
    expect(metrics.passedCount).toBe(2);
    expect(metrics.failedCount).toBe(1);
    expect(metrics.passRate).toBeCloseTo(0.667, 2);
  });

  it('should evict oldest when at capacity', () => {
    const smallStore = new ResultStore(3);
    
    smallStore.add(createStoredResult({ id: 'r1' }));
    smallStore.add(createStoredResult({ id: 'r2' }));
    smallStore.add(createStoredResult({ id: 'r3' }));
    smallStore.add(createStoredResult({ id: 'r4' }));

    expect(smallStore.getSize()).toBe(3);
    expect(smallStore.get('r1')).toBeUndefined();
    expect(smallStore.get('r4')).toBeDefined();
  });
});

describe('EvaluationQueue', () => {
  let queue: EvaluationQueue;

  beforeEach(() => {
    queue = new EvaluationQueue();
  });

  it('should enqueue and process jobs', async () => {
    const ruleSet = createRuleSet('proj_1', 'Test', [
      createContainsCriterion('Has France', 'France'),
    ]);
    queue.addRuleSet(ruleSet);

    const input = createTestInput({ output: 'France is great!' });
    const jobId = queue.enqueue(ruleSet.id, input);

    expect(queue.getPendingCount()).toBe(1);

    const result = await queue.processNext();
    expect(result).toBeDefined();
    expect(result?.passed).toBe(true);
    expect(queue.getPendingCount()).toBe(0);
  });

  it('should track job status', async () => {
    const ruleSet = createRuleSet('proj_1', 'Test', []);
    queue.addRuleSet(ruleSet);

    const input = createTestInput();
    const jobId = queue.enqueue(ruleSet.id, input);

    let job = queue.getJob(jobId);
    expect(job?.status).toBe('pending');

    await queue.processNext();

    job = queue.getJob(jobId);
    expect(job?.status).toBe('completed');
  });

  it('should handle missing rule set', async () => {
    const input = createTestInput();
    queue.enqueue('nonexistent_rs', input);

    const result = await queue.processNext();
    expect(result).toBeNull();

    const stats = queue.getStats();
    expect(stats.failed).toBe(1);
  });

  it('should return null when queue is empty', async () => {
    const result = await queue.processNext();
    expect(result).toBeNull();
  });

  it('should track stats', async () => {
    const ruleSet = createRuleSet('proj_1', 'Test', []);
    queue.addRuleSet(ruleSet);

    queue.enqueue(ruleSet.id, createTestInput());
    queue.enqueue(ruleSet.id, createTestInput());

    expect(queue.getStats().pending).toBe(2);

    await queue.processNext();
    
    const stats = queue.getStats();
    expect(stats.pending).toBe(1);
    expect(stats.completed).toBe(1);
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('Factory Functions', () => {
  describe('createRuleSet', () => {
    it('should create a rule set with defaults', () => {
      const ruleSet = createRuleSet('proj_1', 'Test Rules', []);

      expect(ruleSet.projectId).toBe('proj_1');
      expect(ruleSet.name).toBe('Test Rules');
      expect(ruleSet.async).toBe(true);
      expect(ruleSet.sampleRate).toBe(1.0);
      expect(ruleSet.enabled).toBe(true);
      expect(ruleSet.filter).toEqual({});
    });

    it('should apply custom options', () => {
      const ruleSet = createRuleSet('proj_1', 'Test', [], {
        description: 'Test description',
        async: false,
        sampleRate: 0.5,
        filter: { models: ['gpt-4'] },
      });

      expect(ruleSet.description).toBe('Test description');
      expect(ruleSet.async).toBe(false);
      expect(ruleSet.sampleRate).toBe(0.5);
      expect(ruleSet.filter.models).toEqual(['gpt-4']);
    });
  });

  describe('createRegexCriterion', () => {
    it('should create regex criterion with defaults', () => {
      const criterion = createRegexCriterion('Test', '^test$');

      expect(criterion.type).toBe('regex_match');
      expect(criterion.weight).toBe(1);
      expect(criterion.severity).toBe('warning');
      expect(criterion.enabled).toBe(true);
    });
  });

  describe('createContainsCriterion', () => {
    it('should create contains criterion', () => {
      const criterion = createContainsCriterion('Has keyword', 'hello', {
        caseSensitive: true,
        severity: 'error',
      });

      expect(criterion.type).toBe('contains');
      expect(criterion.severity).toBe('error');
    });
  });

  describe('createLatencyCriterion', () => {
    it('should create latency criterion', () => {
      const criterion = createLatencyCriterion('Fast', 1000, { severity: 'critical' });

      expect(criterion.type).toBe('latency_max');
      expect(criterion.severity).toBe('critical');
    });
  });

  describe('createCostCriterion', () => {
    it('should create cost criterion', () => {
      const criterion = createCostCriterion('Budget', 0.10, { weight: 2 });

      expect(criterion.type).toBe('cost_max');
      expect(criterion.weight).toBe(2);
    });
  });
});
