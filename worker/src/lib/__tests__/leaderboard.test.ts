/**
 * Public Leaderboard System Tests
 * 
 * Tests for:
 * - Data anonymization
 * - Metrics calculation
 * - Leaderboard entry creation
 * - Filtering and sorting
 * - Store operations
 * - ClickHouse integration
 * 
 * @feature PUBLIC_LEADERBOARD
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Anonymization
  anonymizeText,
  anonymizeJSON,
  generateAnonymousName,
  // Metrics
  calculateAgentMetrics,
  selectSampleData,
  // Entry creation
  createLeaderboardEntry,
  validateShareRequest,
  // Store
  LeaderboardStore,
  // ClickHouse
  toClickHouseLeaderboardRow,
  fromClickHouseLeaderboardRow,
  generateClickHouseLeaderboardInsert,
  // Social
  generateOGImageUrl,
  generateSocialMetadata,
  // Types
  type ShareAgentRequest,
  type LeaderboardEntry,
  type LeaderboardFilter,
} from '../leaderboard';

// ============================================================================
// Test Fixtures
// ============================================================================

const createTestRun = (overrides: any = {}) => ({
  id: `run_${Math.random()}`,
  agent_name: 'TestAgent',
  status: 'completed',
  success: true,
  cost: 0.02,
  latency_ms: 500,
  input: 'Test input',
  output: 'Test output',
  ...overrides,
});

const createShareRequest = (overrides: Partial<ShareAgentRequest> = {}): ShareAgentRequest => ({
  projectId: 'proj_test',
  agentName: 'TestAgent',
  runIds: ['run_1', 'run_2', 'run_3'],
  displayName: 'MyAgent',
  displayAuthor: 'TestUser',
  category: 'Testing',
  tags: ['test', 'demo'],
  description: 'Test agent',
  ...overrides,
});

// ============================================================================
// Anonymization Tests
// ============================================================================

describe('Data Anonymization', () => {
  describe('anonymizeText', () => {
    it('should redact email addresses', () => {
      const text = 'Contact me at john.doe@example.com for details';
      const result = anonymizeText(text);
      
      expect(result).toContain('[EMAIL_REDACTED]');
      expect(result).not.toContain('john.doe@example.com');
    });

    it('should redact phone numbers', () => {
      const text = 'Call me at 555-123-4567 or (555) 987-6543';
      const result = anonymizeText(text);
      
      expect(result).toContain('[PHONE_REDACTED]');
      expect(result).not.toContain('555-123-4567');
      expect(result).not.toContain('555) 987-6543');
    });

    it('should redact URLs', () => {
      const text = 'Visit https://example.com for more info';
      const result = anonymizeText(text);
      
      expect(result).toContain('[URL_REDACTED]');
      expect(result).not.toContain('https://example.com');
    });

    it('should redact API keys', () => {
      const text = 'Use key sk-1234567890abcdefghijklmnopqrstuvwxyz for auth';
      const result = anonymizeText(text);
      
      expect(result).toContain('[API_KEY_REDACTED]');
      expect(result).not.toContain('sk-1234567890abcdefghijklmnopqrstuvwxyz');
    });

    it('should redact IP addresses', () => {
      const text = 'Server IP: 192.168.1.100';
      const result = anonymizeText(text);
      
      expect(result).toContain('[IP_REDACTED]');
      expect(result).not.toContain('192.168.1.100');
    });

    it('should redact credit card numbers', () => {
      const text = 'Card: 4532-1234-5678-9010';
      const result = anonymizeText(text);
      
      expect(result).toContain('[CARD_REDACTED]');
    });

    it('should redact SSN', () => {
      const text = 'SSN: 123-45-6789';
      const result = anonymizeText(text);
      
      expect(result).toContain('[SSN_REDACTED]');
    });

    it('should truncate long text', () => {
      const longText = 'a'.repeat(1000);
      const result = anonymizeText(longText, { 
        removeEmails: false,
        removePhones: false,
        removeUrls: false,
        removeApiKeys: false,
        maxSampleLength: 100,
      });
      
      expect(result.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(result).toContain('...');
    });

    it('should preserve clean text', () => {
      const text = 'This is a simple message with no sensitive data.';
      const result = anonymizeText(text);
      
      expect(result).toBe(text);
    });
  });

  describe('anonymizeJSON', () => {
    it('should anonymize string values', () => {
      const data = {
        message: 'Email me at test@example.com',
      };
      const result = anonymizeJSON(data);
      
      expect(result.message).toContain('[EMAIL_REDACTED]');
    });

    it('should anonymize nested objects', () => {
      const data = {
        user: {
          contact: 'Call 555-123-4567',
        },
      };
      const result = anonymizeJSON(data);
      
      expect(result.user.contact).toContain('[PHONE_REDACTED]');
    });

    it('should anonymize arrays', () => {
      const data = ['test@example.com', 'another@example.com'];
      const result = anonymizeJSON(data);
      
      expect(result[0]).toContain('[EMAIL_REDACTED]');
      expect(result[1]).toContain('[EMAIL_REDACTED]');
    });

    it('should redact sensitive keys', () => {
      const data = {
        apiKey: 'sk-1234567890',
        secret: 'my-secret',
        password: 'password123',
        token: 'bearer-token',
        normalField: 'safe value',
      };
      const result = anonymizeJSON(data);
      
      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.secret).toBe('[REDACTED]');
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.normalField).toBe('safe value');
    });
  });

  describe('generateAnonymousName', () => {
    it('should generate a name with adjective, noun, and number', () => {
      const name = generateAnonymousName();
      
      expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d{1,3}$/);
    });

    it('should generate unique names', () => {
      const names = new Set();
      for (let i = 0; i < 100; i++) {
        names.add(generateAnonymousName());
      }
      
      expect(names.size).toBeGreaterThan(50); // Should have good variety
    });
  });
});

// ============================================================================
// Metrics Calculation Tests
// ============================================================================

describe('Metrics Calculation', () => {
  describe('calculateAgentMetrics', () => {
    it('should calculate metrics for successful runs', () => {
      const runs = [
        createTestRun({ cost: 0.01, latency_ms: 100 }),
        createTestRun({ cost: 0.02, latency_ms: 200 }),
        createTestRun({ cost: 0.03, latency_ms: 300 }),
      ];

      const metrics = calculateAgentMetrics(runs);

      expect(metrics.totalRuns).toBe(3);
      expect(metrics.successCount).toBe(3);
      expect(metrics.failureCount).toBe(0);
      expect(metrics.successRate).toBe(1);
      expect(metrics.avgCostPerTask).toBeCloseTo(0.02, 3);
      expect(metrics.avgLatencyMs).toBe(200);
      expect(metrics.totalCost).toBeCloseTo(0.06, 3);
    });

    it('should handle mixed success/failure runs', () => {
      const runs = [
        createTestRun({ success: true, status: 'completed' }),
        createTestRun({ success: false, status: 'failed' }),
        createTestRun({ success: true, status: 'completed' }),
        createTestRun({ success: false, status: 'failed' }),
        createTestRun({ success: true, status: 'completed' }),
      ];

      const metrics = calculateAgentMetrics(runs);

      expect(metrics.totalRuns).toBe(5);
      expect(metrics.successCount).toBe(3);
      expect(metrics.failureCount).toBe(2);
      expect(metrics.successRate).toBe(0.6);
    });

    it('should return zeros for empty runs array', () => {
      const metrics = calculateAgentMetrics([]);

      expect(metrics.totalRuns).toBe(0);
      expect(metrics.successCount).toBe(0);
      expect(metrics.failureCount).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.avgCostPerTask).toBe(0);
      expect(metrics.avgLatencyMs).toBe(0);
      expect(metrics.totalCost).toBe(0);
    });
  });

  describe('selectSampleData', () => {
    it('should select sample inputs and outputs', () => {
      const runs = [
        createTestRun({ input: 'Input 1', output: 'Output 1' }),
        createTestRun({ input: 'Input 2', output: 'Output 2' }),
        createTestRun({ input: 'Input 3', output: 'Output 3' }),
      ];

      const samples = selectSampleData(runs, 3);

      expect(samples.inputs).toHaveLength(3);
      expect(samples.outputs).toHaveLength(3);
      expect(samples.inputs[0]).toBe('Input 1');
      expect(samples.outputs[0]).toBe('Output 1');
    });

    it('should prefer successful runs', () => {
      const runs = [
        createTestRun({ input: 'Fail 1', success: false, status: 'failed' }),
        createTestRun({ input: 'Success 1', success: true, status: 'completed' }),
        createTestRun({ input: 'Success 2', success: true, status: 'completed' }),
      ];

      const samples = selectSampleData(runs, 2);

      expect(samples.inputs).toHaveLength(2);
      expect(samples.inputs[0]).toBe('Success 1');
      expect(samples.inputs[1]).toBe('Success 2');
    });

    it('should anonymize samples', () => {
      const runs = [
        createTestRun({ 
          input: 'Contact test@example.com',
          output: 'Response with test@example.com',
        }),
      ];

      const samples = selectSampleData(runs, 1);

      expect(samples.inputs[0]).toContain('[EMAIL_REDACTED]');
      expect(samples.outputs[0]).toContain('[EMAIL_REDACTED]');
    });
  });
});

// ============================================================================
// Entry Creation Tests
// ============================================================================

describe('Leaderboard Entry Creation', () => {
  describe('createLeaderboardEntry', () => {
    it('should create entry with calculated metrics', () => {
      const request = createShareRequest();
      const runs = [
        createTestRun({ cost: 0.01 }),
        createTestRun({ cost: 0.02 }),
        createTestRun({ cost: 0.03 }),
      ];

      const entry = createLeaderboardEntry(request, 'user_123', runs);

      expect(entry.projectId).toBe('proj_test');
      expect(entry.agentName).toBe('TestAgent');
      expect(entry.userId).toBe('user_123');
      expect(entry.displayName).toBe('MyAgent');
      expect(entry.displayAuthor).toBe('TestUser');
      expect(entry.category).toBe('Testing');
      expect(entry.tags).toEqual(['test', 'demo']);
      expect(entry.totalRuns).toBe(3);
      expect(entry.successRate).toBe(1);
      expect(entry.isPublic).toBe(true);
      expect(entry.isFeatured).toBe(false);
    });

    it('should generate anonymous name if not provided', () => {
      const request = createShareRequest({ displayName: undefined });
      const runs = [createTestRun()];

      const entry = createLeaderboardEntry(request, 'user_123', runs);

      expect(entry.displayName).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d{1,3}$/);
    });

    it('should default to Anonymous author', () => {
      const request = createShareRequest({ displayAuthor: undefined });
      const runs = [createTestRun()];

      const entry = createLeaderboardEntry(request, 'user_123', runs);

      expect(entry.displayAuthor).toBe('Anonymous');
    });
  });

  describe('validateShareRequest', () => {
    it('should pass valid request', () => {
      const request = createShareRequest();
      const error = validateShareRequest(request);
      
      expect(error).toBeNull();
    });

    it('should reject missing projectId', () => {
      const request = createShareRequest({ projectId: '' });
      const error = validateShareRequest(request);
      
      expect(error).toContain('Project ID');
    });

    it('should reject missing agentName', () => {
      const request = createShareRequest({ agentName: '' });
      const error = validateShareRequest(request);
      
      expect(error).toContain('Agent name');
    });

    it('should reject empty runIds', () => {
      const request = createShareRequest({ runIds: [] });
      const error = validateShareRequest(request);
      
      expect(error).toContain('run ID');
    });

    it('should reject too long displayName', () => {
      const request = createShareRequest({ displayName: 'a'.repeat(101) });
      const error = validateShareRequest(request);
      
      expect(error).toContain('Display name');
    });

    it('should reject too long description', () => {
      const request = createShareRequest({ description: 'a'.repeat(501) });
      const error = validateShareRequest(request);
      
      expect(error).toContain('Description');
    });

    it('should reject too many tags', () => {
      const request = createShareRequest({ tags: Array(11).fill('tag') });
      const error = validateShareRequest(request);
      
      expect(error).toContain('tags');
    });
  });
});

// ============================================================================
// Store Tests
// ============================================================================

describe('LeaderboardStore', () => {
  let store: LeaderboardStore;

  beforeEach(() => {
    store = new LeaderboardStore();
  });

  const createEntry = (overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
    id: `lb_${Math.random()}`,
    agentName: 'TestAgent',
    projectId: 'proj_1',
    userId: 'user_1',
    displayName: 'TestAgent',
    displayAuthor: 'Anonymous',
    totalRuns: 100,
    successCount: 90,
    failureCount: 10,
    successRate: 0.9,
    avgCostPerTask: 0.02,
    avgLatencyMs: 500,
    totalCost: 2.0,
    tags: [],
    sampleInputs: [],
    sampleOutputs: [],
    isPublic: true,
    isFeatured: false,
    views: 0,
    upvotes: 0,
    sharedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  it('should add and retrieve entries', () => {
    const entry = createEntry();
    store.add(entry);

    expect(store.get(entry.id)).toEqual(entry);
    expect(store.getSize()).toBe(1);
  });

  it('should get public entries only', () => {
    store.add(createEntry({ id: 'e1', isPublic: true }));
    store.add(createEntry({ id: 'e2', isPublic: false }));
    store.add(createEntry({ id: 'e3', isPublic: true }));

    const publicEntries = store.getPublic();
    expect(publicEntries).toHaveLength(2);
  });

  it('should get featured entries sorted by rank', () => {
    store.add(createEntry({ id: 'e1', isFeatured: true, featuredRank: 3 }));
    store.add(createEntry({ id: 'e2', isFeatured: true, featuredRank: 1 }));
    store.add(createEntry({ id: 'e3', isFeatured: false }));
    store.add(createEntry({ id: 'e4', isFeatured: true, featuredRank: 2 }));

    const featured = store.getFeatured();
    expect(featured).toHaveLength(3);
    expect(featured[0].id).toBe('e2'); // Rank 1
    expect(featured[1].id).toBe('e4'); // Rank 2
    expect(featured[2].id).toBe('e1'); // Rank 3
  });

  it('should filter by category', () => {
    store.add(createEntry({ id: 'e1', category: 'Support' }));
    store.add(createEntry({ id: 'e2', category: 'Coding' }));
    store.add(createEntry({ id: 'e3', category: 'Support' }));

    const filter: LeaderboardFilter = { category: 'Support' };
    const results = store.filter(filter);

    expect(results).toHaveLength(2);
  });

  it('should filter by tags', () => {
    store.add(createEntry({ id: 'e1', tags: ['fast', 'cheap'] }));
    store.add(createEntry({ id: 'e2', tags: ['accurate'] }));
    store.add(createEntry({ id: 'e3', tags: ['fast', 'accurate'] }));

    const filter: LeaderboardFilter = { tags: ['fast'] };
    const results = store.filter(filter);

    expect(results).toHaveLength(2);
  });

  it('should filter by min success rate', () => {
    store.add(createEntry({ id: 'e1', successRate: 0.95 }));
    store.add(createEntry({ id: 'e2', successRate: 0.85 }));
    store.add(createEntry({ id: 'e3', successRate: 0.90 }));

    const filter: LeaderboardFilter = { minSuccessRate: 0.9 };
    const results = store.filter(filter);

    expect(results).toHaveLength(2);
  });

  it('should sort by success rate', () => {
    store.add(createEntry({ id: 'e1', successRate: 0.85 }));
    store.add(createEntry({ id: 'e2', successRate: 0.95 }));
    store.add(createEntry({ id: 'e3', successRate: 0.90 }));

    const filter: LeaderboardFilter = { sortBy: 'success_rate' };
    const results = store.filter(filter);

    expect(results[0].id).toBe('e2'); // 0.95
    expect(results[1].id).toBe('e3'); // 0.90
    expect(results[2].id).toBe('e1'); // 0.85
  });

  it('should sort by cost efficiency', () => {
    store.add(createEntry({ id: 'e1', avgCostPerTask: 0.03 }));
    store.add(createEntry({ id: 'e2', avgCostPerTask: 0.01 }));
    store.add(createEntry({ id: 'e3', avgCostPerTask: 0.02 }));

    const filter: LeaderboardFilter = { sortBy: 'cost_efficiency' };
    const results = store.filter(filter);

    expect(results[0].id).toBe('e2'); // 0.01 (best)
    expect(results[1].id).toBe('e3'); // 0.02
    expect(results[2].id).toBe('e1'); // 0.03
  });

  it('should paginate results', () => {
    for (let i = 0; i < 10; i++) {
      store.add(createEntry({ id: `e${i}` }));
    }

    const page1 = store.filter({ limit: 5, offset: 0 });
    const page2 = store.filter({ limit: 5, offset: 5 });

    expect(page1).toHaveLength(5);
    expect(page2).toHaveLength(5);
    expect(page1[0].id).not.toBe(page2[0].id);
  });

  it('should update entry', () => {
    const entry = createEntry();
    store.add(entry);

    const success = store.update(entry.id, { displayName: 'Updated Name' });
    expect(success).toBe(true);

    const updated = store.get(entry.id);
    expect(updated?.displayName).toBe('Updated Name');
  });

  it('should delete entry', () => {
    const entry = createEntry();
    store.add(entry);

    const success = store.delete(entry.id);
    expect(success).toBe(true);
    expect(store.get(entry.id)).toBeUndefined();
  });

  it('should increment views', () => {
    const entry = createEntry({ views: 10 });
    store.add(entry);

    store.incrementViews(entry.id);
    expect(store.get(entry.id)?.views).toBe(11);
  });

  it('should increment upvotes', () => {
    const entry = createEntry({ upvotes: 5 });
    store.add(entry);

    store.incrementUpvotes(entry.id);
    expect(store.get(entry.id)?.upvotes).toBe(6);
  });

  it('should calculate stats', () => {
    store.add(createEntry({ category: 'Support', successRate: 0.9 }));
    store.add(createEntry({ category: 'Coding', successRate: 0.95 }));
    store.add(createEntry({ category: 'Support', successRate: 0.85 }));

    const stats = store.getStats();

    expect(stats.totalPublicAgents).toBe(3);
    expect(stats.categories['Support']).toBe(2);
    expect(stats.categories['Coding']).toBe(1);
  });
});

// ============================================================================
// ClickHouse Integration Tests
// ============================================================================

describe('ClickHouse Integration', () => {
  describe('toClickHouseLeaderboardRow / fromClickHouseLeaderboardRow', () => {
    it('should convert entry to row and back', () => {
      const original = createEntry({
        id: 'lb_123',
        agentName: 'TestAgent',
        category: 'Testing',
        tags: ['test', 'demo'],
      });

      const row = toClickHouseLeaderboardRow(original);
      const restored = fromClickHouseLeaderboardRow(row);

      expect(restored.id).toBe(original.id);
      expect(restored.agentName).toBe(original.agentName);
      expect(restored.category).toBe(original.category);
      expect(restored.tags).toEqual(original.tags);
      expect(restored.successRate).toBe(original.successRate);
    });
  });

  describe('generateClickHouseLeaderboardInsert', () => {
    it('should generate INSERT statement', () => {
      const entries = [createEntry({ id: 'lb_1' })];
      const sql = generateClickHouseLeaderboardInsert(entries);

      expect(sql).toContain('INSERT INTO leaderboard_entries');
      expect(sql).toContain('lb_1');
    });

    it('should return empty string for no entries', () => {
      const sql = generateClickHouseLeaderboardInsert([]);
      expect(sql).toBe('');
    });
  });
});

// ============================================================================
// Social Sharing Tests
// ============================================================================

describe('Social Sharing', () => {
  describe('generateOGImageUrl', () => {
    it('should generate URL with query params', () => {
      const url = generateOGImageUrl('https://watchllm.com', 'lb_123', {
        agentName: 'TestAgent',
        displayAuthor: 'TestUser',
        successRate: 0.95,
        avgCost: 0.0234,
        totalRuns: 1000,
        category: 'Testing',
      });

      expect(url).toContain('https://watchllm.com/api/og/leaderboard');
      expect(url).toContain('id=lb_123');
      expect(url).toContain('name=TestAgent');
      expect(url).toContain('successRate=95.0');
    });
  });

  describe('generateSocialMetadata', () => {
    it('should generate metadata with OG and Twitter cards', () => {
      const entry = createEntry({
        id: 'lb_123',
        displayName: 'TestAgent',
        successRate: 0.95,
      });

      const metadata = generateSocialMetadata(entry, 'https://watchllm.com');

      expect(metadata.title).toContain('TestAgent');
      expect(metadata.description).toContain('95.0%');
      expect(metadata.openGraph.images[0].url).toContain('/api/og/leaderboard');
      expect(metadata.twitter.card).toBe('summary_large_image');
    });
  });
});

// Helper to create entry
function createEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    id: `lb_${Math.random()}`,
    agentName: 'TestAgent',
    projectId: 'proj_1',
    userId: 'user_1',
    displayName: 'TestAgent',
    displayAuthor: 'Anonymous',
    totalRuns: 100,
    successCount: 90,
    failureCount: 10,
    successRate: 0.9,
    avgCostPerTask: 0.02,
    avgLatencyMs: 500,
    totalCost: 2.0,
    tags: [],
    sampleInputs: [],
    sampleOutputs: [],
    isPublic: true,
    isFeatured: false,
    views: 0,
    upvotes: 0,
    sharedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
