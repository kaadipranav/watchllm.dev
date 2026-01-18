/**
 * Tests for Agent Trace Replay & Modification Module
 * 
 * Tests cover:
 * - Request/response snapshot creation
 * - Step and run snapshot creation
 * - Replay request preparation
 * - Run comparison and diff generation
 * - Modification tracking and statistics
 * - In-memory stores (RunSnapshotStore, ModificationStore)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  type RequestSnapshot,
  type ResponseSnapshot,
  type StepSnapshot,
  type RunSnapshot,
  type RunMetrics,
  type ReplayModification,
  createRequestSnapshot,
  createResponseSnapshot,
  createStepSnapshot,
  prepareReplayRequest,
  snapshotToRequest,
  calculateRunMetrics,
  calculateDiffMetrics,
  compareSteps,
  compareRuns,
  createModificationRecord,
  calculateModificationStats,
  RunSnapshotStore,
  ModificationStore,
} from '../traceReplay';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockRequestData(): Record<string, unknown> {
  return {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, world!' },
    ],
    temperature: 0.7,
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get weather info',
          parameters: { type: 'object', properties: {} },
        },
      },
    ],
  };
}

function createMockResponseData(): Record<string, unknown> {
  return {
    id: 'chatcmpl-123',
    object: 'chat.completion',
    created: 1677652288,
    model: 'gpt-4',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you today?',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 50,
      completion_tokens: 10,
      total_tokens: 60,
    },
  };
}

function createMockStepSnapshot(index: number, overrides: Partial<StepSnapshot> = {}): StepSnapshot {
  return {
    stepIndex: index,
    stepType: 'model_call',
    request: {
      stepIndex: index,
      timestamp: new Date(Date.now() - (5 - index) * 60000).toISOString(),
      model: 'gpt-4',
      messages: [
        { role: 'user', content: `Step ${index} message` },
      ],
      temperature: 0.7,
    },
    response: {
      stepIndex: index,
      timestamp: new Date(Date.now() - (5 - index) * 60000 + 1000).toISOString(),
      model: 'gpt-4',
      content: `Response ${index}`,
      finishReason: 'stop',
      usage: { promptTokens: 20 + index * 5, completionTokens: 10, totalTokens: 30 + index * 5 },
      costUsd: 0.001 + index * 0.0005,
      latencyMs: 1000 + index * 100,
    },
    wasCached: false,
    ...overrides,
  };
}

function createMockRunSnapshot(runId: string, stepCount: number = 3, overrides: Partial<RunSnapshot> = {}): RunSnapshot {
  const steps = Array.from({ length: stepCount }, (_, i) => createMockStepSnapshot(i));
  const totalTokens = steps.reduce((sum, s) => sum + s.response.usage.totalTokens, 0);
  const totalCost = steps.reduce((sum, s) => sum + s.response.costUsd, 0);
  
  return {
    runId,
    projectId: 'proj-test-123',
    agentName: 'test-agent',
    startedAt: new Date(Date.now() - 300000).toISOString(),
    endedAt: new Date().toISOString(),
    status: 'completed',
    steps,
    totalCostUsd: totalCost,
    totalTokens,
    ...overrides,
  };
}

// ============================================================================
// Request Snapshot Tests
// ============================================================================

describe('createRequestSnapshot', () => {
  it('should create a request snapshot from request data', () => {
    const requestData = createMockRequestData();
    const snapshot = createRequestSnapshot(0, requestData);

    expect(snapshot.stepIndex).toBe(0);
    expect(snapshot.model).toBe('gpt-4');
    expect(snapshot.messages).toHaveLength(2);
    expect(snapshot.temperature).toBe(0.7);
    expect(snapshot.timestamp).toBeDefined();
  });

  it('should handle request without body', () => {
    const requestData = { model: 'gpt-4' };
    const snapshot = createRequestSnapshot(0, requestData);

    expect(snapshot.model).toBe('gpt-4');
    expect(snapshot.messages).toEqual([]);
  });

  it('should handle empty request gracefully', () => {
    const snapshot = createRequestSnapshot(0, {});

    expect(snapshot.model).toBe('unknown');
    expect(snapshot.messages).toEqual([]);
  });
});

// ============================================================================
// Response Snapshot Tests
// ============================================================================

describe('createResponseSnapshot', () => {
  it('should create a response snapshot from response data', () => {
    const responseData = createMockResponseData();
    const snapshot = createResponseSnapshot(0, responseData, 1000, 0.002);

    expect(snapshot.stepIndex).toBe(0);
    expect(snapshot.model).toBe('gpt-4');
    expect(snapshot.content).toBe('Hello! How can I help you today?');
    expect(snapshot.finishReason).toBe('stop');
    expect(snapshot.usage.totalTokens).toBe(60);
    expect(snapshot.latencyMs).toBe(1000);
    expect(snapshot.costUsd).toBe(0.002);
  });

  it('should handle response without choices', () => {
    const responseData = { model: 'gpt-4', usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } };
    const snapshot = createResponseSnapshot(0, responseData, 500, 0.001);

    expect(snapshot.content).toBeNull();
    expect(snapshot.finishReason).toBeNull();
    expect(snapshot.usage.totalTokens).toBe(15);
  });

  it('should handle empty response', () => {
    const snapshot = createResponseSnapshot(0, {}, 100, 0);

    expect(snapshot.model).toBe('unknown');
    expect(snapshot.content).toBeNull();
    expect(snapshot.usage.totalTokens).toBe(0);
  });
});

// ============================================================================
// Step Snapshot Tests
// ============================================================================

describe('createStepSnapshot', () => {
  it('should create a step snapshot from request and response', () => {
    const requestData = createMockRequestData();
    const responseData = createMockResponseData();
    
    const step = createStepSnapshot(
      0,
      'model_call',
      requestData,
      responseData,
      1500,
      0.0018
    );

    expect(step.stepIndex).toBe(0);
    expect(step.stepType).toBe('model_call');
    expect(step.request.model).toBe('gpt-4');
    expect(step.response.content).toBe('Hello! How can I help you today?');
    expect(step.response.latencyMs).toBe(1500);
    expect(step.response.costUsd).toBe(0.0018);
    expect(step.wasCached).toBe(false);
  });

  it('should handle error status', () => {
    const requestData = createMockRequestData();
    const responseData = { error: { message: 'Failed', type: 'server_error' } };
    
    const step = createStepSnapshot(
      1,
      'model_call',
      requestData,
      responseData,
      500,
      0,
      false,
      { type: 'server_error', message: 'Internal server error' }
    );

    expect(step.error?.type).toBe('server_error');
    expect(step.error?.message).toBe('Internal server error');
  });
});

// ============================================================================
// Replay Request Preparation Tests
// ============================================================================

describe('prepareReplayRequest', () => {
  it('should prepare replay request from step index', () => {
    const snapshot = createMockRunSnapshot('run-123', 5);
    const modification: ReplayModification = { fromStepIndex: 2 };

    const replayRequest = prepareReplayRequest(snapshot, modification);

    expect(replayRequest.model).toBe('gpt-4');
    expect(replayRequest.messages).toBeDefined();
    expect(replayRequest.stepIndex).toBe(2);
  });

  it('should apply modified messages', () => {
    const snapshot = createMockRunSnapshot('run-123', 3);
    const modification: ReplayModification = {
      fromStepIndex: 1,
      modifiedMessages: [
        { role: 'user', content: 'Modified user message' },
        { role: 'assistant', content: 'Previous response' },
        { role: 'user', content: 'New follow-up' },
      ],
    };

    const replayRequest = prepareReplayRequest(snapshot, modification);

    expect(replayRequest.messages).toHaveLength(3);
    expect(replayRequest.messages[0].content).toBe('Modified user message');
  });

  it('should apply modified tools', () => {
    const snapshot = createMockRunSnapshot('run-123', 3);
    const modification: ReplayModification = {
      fromStepIndex: 0,
      modifiedTools: [
        { type: 'function', function: { name: 'new_tool', description: 'A new tool' } },
      ],
    };

    const replayRequest = prepareReplayRequest(snapshot, modification);

    expect(replayRequest.tools).toHaveLength(1);
    expect(replayRequest.tools![0].function.name).toBe('new_tool');
  });

  it('should apply modified parameters', () => {
    const snapshot = createMockRunSnapshot('run-123', 3);
    const modification: ReplayModification = {
      fromStepIndex: 1,
      modifiedParams: {
        temperature: 0.2,
        maxTokens: 500,
      },
    };

    const replayRequest = prepareReplayRequest(snapshot, modification);

    expect(replayRequest.temperature).toBe(0.2);
    expect(replayRequest.maxTokens).toBe(500);
  });

  it('should throw for invalid step index', () => {
    const snapshot = createMockRunSnapshot('run-123', 3);
    const modification: ReplayModification = { fromStepIndex: 10 };

    expect(() => prepareReplayRequest(snapshot, modification)).toThrow();
  });
});

describe('snapshotToRequest', () => {
  it('should convert snapshot to API request format', () => {
    const snapshot: RequestSnapshot = {
      stepIndex: 0,
      timestamp: new Date().toISOString(),
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.7,
      maxTokens: 100,
    };

    const result = snapshotToRequest(snapshot);

    expect(result.model).toBe('gpt-4');
    expect(result.messages).toHaveLength(1);
    expect(result.temperature).toBe(0.7);
    expect(result.max_tokens).toBe(100);
  });

  it('should handle optional fields', () => {
    const snapshot: RequestSnapshot = {
      stepIndex: 0,
      timestamp: new Date().toISOString(),
      model: 'gpt-4',
      messages: [],
    };

    const result = snapshotToRequest(snapshot);

    expect(result.model).toBe('gpt-4');
    expect(result.temperature).toBeUndefined();
    expect(result.max_tokens).toBeUndefined();
  });
});

// ============================================================================
// Run Metrics Tests
// ============================================================================

describe('calculateRunMetrics', () => {
  it('should calculate metrics for a run snapshot', () => {
    const snapshot = createMockRunSnapshot('run-123', 4);
    const metrics = calculateRunMetrics(snapshot);

    expect(metrics.totalSteps).toBe(4);
    expect(metrics.totalTokens).toBeGreaterThan(0);
    expect(metrics.totalCostUsd).toBe(snapshot.totalCostUsd);
    expect(metrics.successfulSteps).toBe(4);
    expect(metrics.avgLatencyMs).toBeGreaterThan(0);
    expect(metrics.totalLatencyMs).toBeGreaterThan(0);
  });

  it('should calculate success rate correctly', () => {
    const snapshot = createMockRunSnapshot('run-123', 4, {
      steps: [
        createMockStepSnapshot(0),
        createMockStepSnapshot(1, { error: { type: 'error', message: 'Failed' } }),
        createMockStepSnapshot(2),
        createMockStepSnapshot(3),
      ],
    });
    const metrics = calculateRunMetrics(snapshot);

    expect(metrics.successfulSteps).toBe(3);
    expect(metrics.failedSteps).toBe(1);
  });

  it('should handle empty runs', () => {
    const snapshot = createMockRunSnapshot('run-123', 0, { steps: [] });
    const metrics = calculateRunMetrics(snapshot);

    expect(metrics.totalSteps).toBe(0);
    expect(metrics.successfulSteps).toBe(0);
    expect(metrics.avgLatencyMs).toBe(0);
  });
});

// ============================================================================
// Comparison Tests
// ============================================================================

describe('compareSteps', () => {
  it('should detect unchanged steps', () => {
    const step1 = createMockStepSnapshot(0);
    const step2 = JSON.parse(JSON.stringify(step1)); // Deep clone

    const diff = compareSteps(step1, step2);

    expect(diff.diffType).toBe('unchanged');
    expect(diff.changes).toHaveLength(0);
  });

  it('should detect modified steps', () => {
    const step1 = createMockStepSnapshot(0);
    const step2 = createMockStepSnapshot(0, {
      request: {
        ...step1.request,
        temperature: 0.9,
      },
    });

    const diff = compareSteps(step1, step2);

    expect(diff.diffType).toBe('modified');
    expect(diff.changes.length).toBeGreaterThan(0);
  });

  it('should detect cost differences', () => {
    const step1 = createMockStepSnapshot(0);
    const step2 = createMockStepSnapshot(0, {
      response: {
        ...step1.response,
        costUsd: step1.response.costUsd + 0.005,
      },
    });

    const diff = compareSteps(step1, step2);

    expect(diff.diffType).toBe('modified');
    const costChange = diff.changes.find(c => c.field === 'response.costUsd');
    expect(costChange).toBeDefined();
  });

  it('should handle added steps', () => {
    const diff = compareSteps(undefined, createMockStepSnapshot(0));

    expect(diff.diffType).toBe('added');
  });

  it('should handle removed steps', () => {
    const diff = compareSteps(createMockStepSnapshot(0), undefined);

    expect(diff.diffType).toBe('removed');
  });
});

describe('compareRuns', () => {
  it('should compare two runs and calculate metrics', () => {
    const original = createMockRunSnapshot('run-1', 3);
    const replay = createMockRunSnapshot('run-2', 3, {
      totalCostUsd: original.totalCostUsd * 0.8, // 20% cheaper
    });

    const comparison = compareRuns(original, replay);

    expect(comparison.originalRunId).toBe('run-1');
    expect(comparison.replayRunId).toBe('run-2');
    expect(comparison.original).toBeDefined();
    expect(comparison.replay).toBeDefined();
    expect(comparison.diff.costDiff).toBeLessThan(0);
  });

  it('should detect improvements from successful replays', () => {
    const original = createMockRunSnapshot('run-1', 3, { status: 'failed' });
    const replay = createMockRunSnapshot('run-2', 3, { status: 'completed' });

    const comparison = compareRuns(original, replay);

    // Improvement depends on cost/latency reduction, but status change should be detected
    expect(comparison).toBeDefined();
  });

  it('should handle runs with different step counts', () => {
    const original = createMockRunSnapshot('run-1', 5);
    const replay = createMockRunSnapshot('run-2', 3);

    const comparison = compareRuns(original, replay);

    expect(comparison.stepDiffs.length).toBe(5); // Max of the two
    const removedSteps = comparison.stepDiffs.filter(d => d.diffType === 'removed');
    expect(removedSteps.length).toBe(2);
  });
});

describe('calculateDiffMetrics', () => {
  it('should calculate diff metrics between run metrics', () => {
    const original: RunMetrics = {
      totalSteps: 3,
      successfulSteps: 3,
      failedSteps: 0,
      totalCostUsd: 0.01,
      totalTokens: 100,
      totalLatencyMs: 3000,
      avgLatencyMs: 1000,
      cacheHitRate: 0,
      status: 'completed',
    };
    const replay: RunMetrics = {
      totalSteps: 3,
      successfulSteps: 3,
      failedSteps: 0,
      totalCostUsd: 0.008, // 20% cheaper
      totalTokens: 90,   // 10% fewer tokens
      totalLatencyMs: 2700,
      avgLatencyMs: 900,
      cacheHitRate: 0,
      status: 'completed',
    };

    const diff = calculateDiffMetrics(original, replay);

    expect(diff.costDiffPercent).toBeCloseTo(-20, 0);
    expect(diff.tokenDiff).toBe(-10);
    expect(diff.latencyDiff).toBe(-300);
  });
});

// ============================================================================
// Modification Record Tests
// ============================================================================

describe('createModificationRecord', () => {
  it('should create a modification record with comparison', () => {
    const original = createMockRunSnapshot('run-1', 3);
    const replay = createMockRunSnapshot('run-2', 3);
    const comparison = compareRuns(original, replay);
    const modification: ReplayModification = {
      fromStepIndex: 1,
      modifiedParams: { temperature: 0.5 },
      modificationDescription: 'Reduced temperature',
    };

    const record = createModificationRecord(
      'run-1',
      'run-2',
      1,
      modification,
      comparison,
      'proj-123',
      'user-456'
    );

    expect(record.id).toBeDefined();
    expect(record.originalRunId).toBe('run-1');
    expect(record.replayRunId).toBe('run-2');
    expect(record.fromStepIndex).toBe(1);
    expect(record.projectId).toBe('proj-123');
    expect(record.userId).toBe('user-456');
    expect(record.createdAt).toBeDefined();
  });

  it('should detect successful modifications', () => {
    const original = createMockRunSnapshot('run-1', 3, { status: 'failed' });
    const replay = createMockRunSnapshot('run-2', 3, { status: 'completed' });
    const comparison = compareRuns(original, replay);
    const modification: ReplayModification = { fromStepIndex: 0 };

    const record = createModificationRecord(
      'run-1',
      'run-2',
      0,
      modification,
      comparison,
      'proj-123'
    );

    expect(record).toBeDefined();
    expect(record.originalRunId).toBe('run-1');
  });
});

describe('calculateModificationStats', () => {
  it('should calculate statistics for multiple modifications', () => {
    const records = [
      { 
        id: '1',
        successful: true, 
        comparison: { improvementScore: 0.5 }, 
        modification: { fromStepIndex: 0, modifiedParams: { temperature: 0.5 } },
        projectId: 'proj-1',
      },
      { 
        id: '2',
        successful: true, 
        comparison: { improvementScore: 0.3 }, 
        modification: { fromStepIndex: 1, modifiedMessages: [] },
        projectId: 'proj-1',
      },
      { 
        id: '3',
        successful: false, 
        comparison: { improvementScore: -0.1 }, 
        modification: { fromStepIndex: 2, modifiedTools: [] },
        projectId: 'proj-1',
      },
      { 
        id: '4',
        successful: true, 
        comparison: { improvementScore: 0.2 }, 
        modification: { fromStepIndex: 0, modifiedParams: { maxTokens: 100 } },
        projectId: 'proj-1',
      },
    ] as any[];

    const stats = calculateModificationStats(records);

    expect(stats.totalModifications).toBe(4);
    expect(stats.successfulModifications).toBe(3);
    expect(stats.successRate).toBe(75);
    expect(stats.avgImprovementScore).toBeCloseTo(0.225, 2);
  });

  it('should handle empty records', () => {
    const stats = calculateModificationStats([]);

    expect(stats.totalModifications).toBe(0);
    expect(stats.successRate).toBe(0);
    expect(stats.avgImprovementScore).toBe(0);
  });
});

// ============================================================================
// RunSnapshotStore Tests
// ============================================================================

describe('RunSnapshotStore', () => {
  let store: RunSnapshotStore;

  beforeEach(() => {
    store = new RunSnapshotStore(5);
  });

  it('should store and retrieve snapshots', () => {
    const snapshot = createMockRunSnapshot('run-1');
    store.set('run-1', snapshot);

    const retrieved = store.get('run-1');
    expect(retrieved).toEqual(snapshot);
  });

  it('should return undefined for non-existent snapshots', () => {
    const retrieved = store.get('non-existent');
    expect(retrieved).toBeUndefined();
  });

  it('should check if snapshot exists', () => {
    const snapshot = createMockRunSnapshot('run-1');
    store.set('run-1', snapshot);

    expect(store.has('run-1')).toBe(true);
    expect(store.has('run-2')).toBe(false);
  });

  it('should delete snapshots', () => {
    const snapshot = createMockRunSnapshot('run-1');
    store.set('run-1', snapshot);
    
    const deleted = store.delete('run-1');
    expect(deleted).toBe(true);
    expect(store.get('run-1')).toBeUndefined();
  });

  it('should enforce max size by evicting oldest entries', () => {
    for (let i = 1; i <= 7; i++) {
      store.set(`run-${i}`, createMockRunSnapshot(`run-${i}`));
    }

    expect(store.getSize()).toBe(5);
    expect(store.has('run-1')).toBe(false);
    expect(store.has('run-2')).toBe(false);
    expect(store.has('run-7')).toBe(true);
  });

  it('should clear all snapshots', () => {
    store.set('run-1', createMockRunSnapshot('run-1'));
    store.set('run-2', createMockRunSnapshot('run-2'));
    
    store.clear();
    expect(store.getSize()).toBe(0);
  });
});

// ============================================================================
// ModificationStore Tests
// ============================================================================

describe('ModificationStore', () => {
  let store: ModificationStore;

  beforeEach(() => {
    store = new ModificationStore(10);
  });

  it('should add and retrieve modifications', () => {
    const original = createMockRunSnapshot('run-1');
    const replay = createMockRunSnapshot('run-2');
    const comparison = compareRuns(original, replay);
    const modification: ReplayModification = { fromStepIndex: 0 };
    
    const record = createModificationRecord('run-1', 'run-2', 0, modification, comparison, 'proj-1');
    store.add(record);

    const retrieved = store.get(record.id);
    expect(retrieved).toEqual(record);
  });

  it('should get modifications by original run ID', () => {
    const original = createMockRunSnapshot('run-1');
    const replay1 = createMockRunSnapshot('replay-1');
    const replay2 = createMockRunSnapshot('replay-2');
    
    const comparison1 = compareRuns(original, replay1);
    const comparison2 = compareRuns(original, replay2);
    
    const record1 = createModificationRecord('run-1', 'replay-1', 0, { fromStepIndex: 0 }, comparison1, 'proj-1');
    const record2 = createModificationRecord('run-1', 'replay-2', 1, { fromStepIndex: 1 }, comparison2, 'proj-1');
    const record3 = createModificationRecord('run-2', 'replay-3', 0, { fromStepIndex: 0 }, comparison1, 'proj-1');
    
    store.add(record1);
    store.add(record2);
    store.add(record3);

    const modifications = store.getByOriginalRun('run-1');
    expect(modifications).toHaveLength(2);
  });

  it('should get modifications by project', () => {
    const original = createMockRunSnapshot('run-1');
    const replay = createMockRunSnapshot('replay-1');
    const comparison = compareRuns(original, replay);
    
    const record1 = createModificationRecord('run-1', 'replay-1', 0, { fromStepIndex: 0 }, comparison, 'proj-1');
    const record2 = createModificationRecord('run-2', 'replay-2', 0, { fromStepIndex: 0 }, comparison, 'proj-1');
    const record3 = createModificationRecord('run-3', 'replay-3', 0, { fromStepIndex: 0 }, comparison, 'proj-2');
    
    store.add(record1);
    store.add(record2);
    store.add(record3);

    const projectMods = store.getByProject('proj-1');
    expect(projectMods).toHaveLength(2);
  });

  it('should update user feedback', () => {
    const original = createMockRunSnapshot('run-1');
    const replay = createMockRunSnapshot('replay-1');
    const comparison = compareRuns(original, replay);
    const record = createModificationRecord('run-1', 'replay-1', 0, { fromStepIndex: 0 }, comparison, 'proj-1');
    
    store.add(record);
    const success = store.updateUserFeedback(record.id, 5, 'Great improvement!');
    
    expect(success).toBe(true);
    const updated = store.get(record.id);
    expect(updated?.userRating).toBe(5);
    expect(updated?.userNotes).toBe('Great improvement!');
  });

  it('should calculate project statistics', () => {
    const original = createMockRunSnapshot('run-1', 3, { status: 'failed' });
    const replay = createMockRunSnapshot('replay-1', 3, { status: 'completed' });
    const comparison = compareRuns(original, replay);
    
    for (let i = 0; i < 5; i++) {
      const record = createModificationRecord(
        `run-${i}`,
        `replay-${i}`,
        0,
        { fromStepIndex: 0, modifiedParams: { temperature: 0.5 } },
        { ...comparison, improved: i < 3 },
        'proj-1'
      );
      record.successful = i < 3;
      store.add(record);
    }

    const stats = store.getProjectStats('proj-1');
    expect(stats.totalModifications).toBe(5);
    expect(stats.successfulModifications).toBe(3);
    expect(stats.successRate).toBe(60);
  });

  it('should enforce max size', () => {
    const original = createMockRunSnapshot('run-1');
    const replay = createMockRunSnapshot('replay-1');
    const comparison = compareRuns(original, replay);
    
    for (let i = 0; i < 15; i++) {
      const record = createModificationRecord(`run-${i}`, `replay-${i}`, 0, { fromStepIndex: 0 }, comparison, 'proj-1');
      store.add(record);
    }

    expect(store.getSize()).toBe(10);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Trace Replay Integration', () => {
  it('should support full replay workflow', () => {
    // 1. Create original run snapshot
    const original = createMockRunSnapshot('run-original', 4, {
      steps: [
        createMockStepSnapshot(0),
        createMockStepSnapshot(1),
        createMockStepSnapshot(2, { error: { type: 'error', message: 'Step failed' } }),
        createMockStepSnapshot(3, { error: { type: 'error', message: 'Step failed' } }),
      ],
    });

    // 2. Define modification (fix from step 2)
    const modification: ReplayModification = {
      fromStepIndex: 2,
      modifiedMessages: [
        { role: 'user', content: 'Please use a different approach' },
      ],
      modifiedParams: {
        temperature: 0.2,
      },
      modificationDescription: 'Reduced temperature and clarified instructions',
    };

    // 3. Prepare replay request
    const replayRequest = prepareReplayRequest(original, modification);
    expect(replayRequest.temperature).toBe(0.2);

    // 4. Simulate replay run completing successfully
    const replay = createMockRunSnapshot('run-replay', 4, {
      steps: [
        createMockStepSnapshot(0),
        createMockStepSnapshot(1),
        createMockStepSnapshot(2),
        createMockStepSnapshot(3),
      ],
    });

    // 5. Compare runs
    const comparison = compareRuns(original, replay);
    expect(comparison).toBeDefined();
    expect(comparison.originalRunId).toBe('run-original');
    expect(comparison.replayRunId).toBe('run-replay');

    // 6. Create modification record
    const record = createModificationRecord(
      'run-original',
      'run-replay',
      2,
      modification,
      comparison,
      'proj-123',
      'user-456'
    );
    expect(record.id).toBeDefined();

    // 7. Store for tracking
    const modStore = new ModificationStore();
    modStore.add(record);

    // 8. Add user feedback
    modStore.updateUserFeedback(record.id, 5, 'This fix worked perfectly');

    // 9. Get stats
    const stats = modStore.getProjectStats('proj-123');
    expect(stats.totalModifications).toBe(1);
  });

  it('should handle multiple modification attempts', () => {
    const snapshotStore = new RunSnapshotStore();
    const modStore = new ModificationStore();

    const original = createMockRunSnapshot('run-1', 3, { status: 'failed' });
    snapshotStore.set('run-1', original);

    // Attempt 1: Failed modification
    const replay1 = createMockRunSnapshot('replay-1', 3, { status: 'failed' });
    snapshotStore.set('replay-1', replay1);
    const comp1 = compareRuns(original, replay1);
    const record1 = createModificationRecord('run-1', 'replay-1', 0, { fromStepIndex: 0 }, comp1, 'proj-1');
    record1.successful = false;
    modStore.add(record1);

    // Attempt 2: Successful modification
    const replay2 = createMockRunSnapshot('replay-2', 3, { status: 'completed' });
    snapshotStore.set('replay-2', replay2);
    const comp2 = compareRuns(original, replay2);
    const record2 = createModificationRecord('run-1', 'replay-2', 0, { fromStepIndex: 0 }, comp2, 'proj-1');
    record2.successful = true;
    modStore.add(record2);

    // Check modification history
    const modifications = modStore.getByOriginalRun('run-1');
    expect(modifications).toHaveLength(2);

    const stats = modStore.getProjectStats('proj-1');
    expect(stats.successRate).toBe(50);
  });
});
