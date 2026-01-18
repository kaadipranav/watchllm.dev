/**
 * Public Leaderboard System
 * 
 * Features:
 * - Opt-in agent sharing with anonymization
 * - Public metrics (cost/task, success rate, latency)
 * - Featured agents
 * - Social sharing with OG images
 * 
 * @feature PUBLIC_LEADERBOARD
 */

// ============================================================================
// Types
// ============================================================================

export interface LeaderboardEntry {
  id: string;
  agentName: string;
  agentDescription?: string;
  projectId: string; // Original project (private)
  userId: string; // Original owner (private)
  
  // Anonymized identifiers
  displayName: string; // Anonymized or user-chosen display name
  displayAuthor: string; // "Anonymous" or verified username
  
  // Metrics
  totalRuns: number;
  successCount: number;
  failureCount: number;
  successRate: number; // 0-1
  avgCostPerTask: number;
  avgLatencyMs: number;
  totalCost: number;
  
  // Categorization
  category?: string; // e.g., "Customer Support", "Data Analysis", "Code Generation"
  tags: string[];
  
  // Sample data (anonymized)
  sampleInputs: string[];
  sampleOutputs: string[];
  
  // Visibility
  isPublic: boolean;
  isFeatured: boolean;
  featuredRank?: number;
  
  // Social
  views: number;
  upvotes: number;
  
  // Metadata
  sharedAt: string;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface LeaderboardStats {
  totalPublicAgents: number;
  totalRuns: number;
  avgSuccessRate: number;
  categories: Record<string, number>;
}

export interface ShareAgentRequest {
  projectId: string;
  agentName: string;
  runIds: string[]; // Runs to include in metrics
  displayName?: string; // Custom display name
  displayAuthor?: string; // How to attribute (default: "Anonymous")
  category?: string;
  tags?: string[];
  description?: string;
}

export interface AnonymizationConfig {
  removeEmails: boolean;
  removePhones: boolean;
  removeUrls: boolean;
  removeApiKeys: boolean;
  removeCustomPatterns?: RegExp[];
  maxSampleLength: number;
}

export interface LeaderboardFilter {
  category?: string;
  tags?: string[];
  minSuccessRate?: number;
  maxCostPerTask?: number;
  sortBy?: 'success_rate' | 'cost_efficiency' | 'popularity' | 'recent';
  limit?: number;
  offset?: number;
}

export interface OGImageConfig {
  agentName: string;
  displayAuthor: string;
  successRate: number;
  avgCost: number;
  totalRuns: number;
  category?: string;
}

// ============================================================================
// Data Anonymization
// ============================================================================

const DEFAULT_ANONYMIZATION_CONFIG: AnonymizationConfig = {
  removeEmails: true,
  removePhones: true,
  removeUrls: true,
  removeApiKeys: true,
  maxSampleLength: 500,
};

/**
 * Patterns for detecting sensitive data
 */
const SENSITIVE_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(?:\+\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
  url: /https?:\/\/[^\s]+/g,
  apiKey: /\b(sk-[a-zA-Z0-9]{32,}|[a-zA-Z0-9_-]{32,})\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

/**
 * Anonymize sensitive data in text
 */
export function anonymizeText(
  text: string,
  config: AnonymizationConfig = DEFAULT_ANONYMIZATION_CONFIG
): string {
  let anonymized = text;

  // Always remove IPs, credit cards, SSNs first (more specific patterns)
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.ipAddress, '[IP_REDACTED]');
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.creditCard, '[CARD_REDACTED]');
  anonymized = anonymized.replace(SENSITIVE_PATTERNS.ssn, '[SSN_REDACTED]');

  if (config.removeEmails) {
    anonymized = anonymized.replace(SENSITIVE_PATTERNS.email, '[EMAIL_REDACTED]');
  }

  if (config.removePhones) {
    anonymized = anonymized.replace(SENSITIVE_PATTERNS.phone, '[PHONE_REDACTED]');
  }

  if (config.removeUrls) {
    anonymized = anonymized.replace(SENSITIVE_PATTERNS.url, '[URL_REDACTED]');
  }

  if (config.removeApiKeys) {
    anonymized = anonymized.replace(SENSITIVE_PATTERNS.apiKey, '[API_KEY_REDACTED]');
  }

  // Apply custom patterns
  if (config.removeCustomPatterns) {
    for (const pattern of config.removeCustomPatterns) {
      anonymized = anonymized.replace(pattern, '[REDACTED]');
    }
  }

  // Truncate if too long
  if (anonymized.length > config.maxSampleLength) {
    anonymized = anonymized.slice(0, config.maxSampleLength) + '...';
  }

  return anonymized;
}

/**
 * Anonymize JSON data recursively
 */
export function anonymizeJSON(
  data: any,
  config: AnonymizationConfig = DEFAULT_ANONYMIZATION_CONFIG
): any {
  if (typeof data === 'string') {
    return anonymizeText(data, config);
  }

  if (Array.isArray(data)) {
    return data.map((item) => anonymizeJSON(item, config));
  }

  if (data && typeof data === 'object') {
    const anonymized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive keys entirely
      if (/api[_-]?key|secret|password|token|auth/i.test(key)) {
        anonymized[key] = '[REDACTED]';
      } else {
        anonymized[key] = anonymizeJSON(value, config);
      }
    }
    return anonymized;
  }

  return data;
}

/**
 * Generate anonymized display name
 */
export function generateAnonymousName(): string {
  const adjectives = [
    'Swift', 'Clever', 'Precise', 'Efficient', 'Smart', 'Quick', 'Bright',
    'Sharp', 'Wise', 'Fast', 'Sleek', 'Agile', 'Nimble', 'Skilled',
  ];
  const nouns = [
    'Agent', 'Assistant', 'Helper', 'Bot', 'AI', 'System', 'Worker',
    'Processor', 'Analyzer', 'Solver', 'Thinker', 'Optimizer',
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);

  return `${adj}${noun}${num}`;
}

// ============================================================================
// Metrics Calculation
// ============================================================================

export interface AgentRunMetrics {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgCostPerTask: number;
  avgLatencyMs: number;
  totalCost: number;
}

/**
 * Calculate aggregate metrics from agent runs
 */
export function calculateAgentMetrics(runs: any[]): AgentRunMetrics {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      avgCostPerTask: 0,
      avgLatencyMs: 0,
      totalCost: 0,
    };
  }

  const successCount = runs.filter((r) => r.status === 'completed' || r.success === true).length;
  const failureCount = runs.length - successCount;
  const totalCost = runs.reduce((sum, r) => sum + (r.cost || 0), 0);
  const totalLatency = runs.reduce((sum, r) => sum + (r.latency_ms || r.latencyMs || 0), 0);

  return {
    totalRuns: runs.length,
    successCount,
    failureCount,
    successRate: successCount / runs.length,
    avgCostPerTask: totalCost / runs.length,
    avgLatencyMs: totalLatency / runs.length,
    totalCost,
  };
}

/**
 * Select representative sample inputs/outputs
 */
export function selectSampleData(
  runs: any[],
  maxSamples: number = 3,
  config: AnonymizationConfig = DEFAULT_ANONYMIZATION_CONFIG
): { inputs: string[]; outputs: string[] } {
  // Prefer successful runs
  const successfulRuns = runs.filter((r) => r.status === 'completed' || r.success === true);
  const sampleRuns = successfulRuns.slice(0, maxSamples);

  const inputs = sampleRuns
    .map((r) => {
      const input = r.input || r.prompt || '';
      return typeof input === 'string' ? input : JSON.stringify(input);
    })
    .map((text) => anonymizeText(text, config));

  const outputs = sampleRuns
    .map((r) => {
      const output = r.output || r.response || '';
      return typeof output === 'string' ? output : JSON.stringify(output);
    })
    .map((text) => anonymizeText(text, config));

  return { inputs, outputs };
}

// ============================================================================
// Leaderboard Entry Store (In-Memory)
// ============================================================================

export class LeaderboardStore {
  private entries: Map<string, LeaderboardEntry> = new Map();
  private viewCounts: Map<string, number> = new Map();
  private upvoteCounts: Map<string, number> = new Map();

  add(entry: LeaderboardEntry): void {
    this.entries.set(entry.id, entry);
  }

  get(id: string): LeaderboardEntry | undefined {
    return this.entries.get(id);
  }

  getAll(): LeaderboardEntry[] {
    return Array.from(this.entries.values());
  }

  getPublic(): LeaderboardEntry[] {
    return this.getAll().filter((e) => e.isPublic);
  }

  getFeatured(): LeaderboardEntry[] {
    return this.getAll()
      .filter((e) => e.isFeatured && e.isPublic)
      .sort((a, b) => (a.featuredRank || 999) - (b.featuredRank || 999));
  }

  getByProject(projectId: string): LeaderboardEntry[] {
    return this.getAll().filter((e) => e.projectId === projectId);
  }

  getByCategory(category: string): LeaderboardEntry[] {
    return this.getPublic().filter((e) => e.category === category);
  }

  filter(filter: LeaderboardFilter): LeaderboardEntry[] {
    let results = this.getPublic();

    if (filter.category) {
      results = results.filter((e) => e.category === filter.category);
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter((e) =>
        filter.tags!.some((tag) => e.tags.includes(tag))
      );
    }

    if (filter.minSuccessRate !== undefined) {
      results = results.filter((e) => e.successRate >= filter.minSuccessRate!);
    }

    if (filter.maxCostPerTask !== undefined) {
      results = results.filter((e) => e.avgCostPerTask <= filter.maxCostPerTask!);
    }

    // Sort
    const sortBy = filter.sortBy || 'popularity';
    switch (sortBy) {
      case 'success_rate':
        results.sort((a, b) => b.successRate - a.successRate);
        break;
      case 'cost_efficiency':
        // Lower cost = better
        results.sort((a, b) => a.avgCostPerTask - b.avgCostPerTask);
        break;
      case 'popularity':
        results.sort((a, b) => (b.upvotes + b.views) - (a.upvotes + a.views));
        break;
      case 'recent':
        results.sort((a, b) => 
          new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()
        );
        break;
    }

    // Pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    return results.slice(offset, offset + limit);
  }

  update(id: string, updates: Partial<LeaderboardEntry>): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;

    this.entries.set(id, {
      ...entry,
      ...updates,
      lastUpdatedAt: new Date().toISOString(),
    });
    return true;
  }

  delete(id: string): boolean {
    return this.entries.delete(id);
  }

  incrementViews(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      entry.views++;
      this.entries.set(id, entry);
    }
  }

  incrementUpvotes(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      entry.upvotes++;
      this.entries.set(id, entry);
    }
  }

  getStats(): LeaderboardStats {
    const publicEntries = this.getPublic();
    const categories: Record<string, number> = {};

    for (const entry of publicEntries) {
      if (entry.category) {
        categories[entry.category] = (categories[entry.category] || 0) + 1;
      }
    }

    const totalRuns = publicEntries.reduce((sum, e) => sum + e.totalRuns, 0);
    const avgSuccessRate =
      publicEntries.reduce((sum, e) => sum + e.successRate, 0) / publicEntries.length || 0;

    return {
      totalPublicAgents: publicEntries.length,
      totalRuns,
      avgSuccessRate,
      categories,
    };
  }

  getSize(): number {
    return this.entries.size;
  }
}

// ============================================================================
// Leaderboard Entry Creation
// ============================================================================

/**
 * Create a leaderboard entry from agent runs
 */
export function createLeaderboardEntry(
  request: ShareAgentRequest,
  userId: string,
  runs: any[],
  config?: AnonymizationConfig
): LeaderboardEntry {
  const metrics = calculateAgentMetrics(runs);
  const samples = selectSampleData(runs, 3, config);
  const displayName = request.displayName || generateAnonymousName();
  const displayAuthor = request.displayAuthor || 'Anonymous';

  return {
    id: `lb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentName: request.agentName,
    agentDescription: request.description,
    projectId: request.projectId,
    userId,
    displayName,
    displayAuthor,
    totalRuns: metrics.totalRuns,
    successCount: metrics.successCount,
    failureCount: metrics.failureCount,
    successRate: metrics.successRate,
    avgCostPerTask: metrics.avgCostPerTask,
    avgLatencyMs: metrics.avgLatencyMs,
    totalCost: metrics.totalCost,
    category: request.category,
    tags: request.tags || [],
    sampleInputs: samples.inputs,
    sampleOutputs: samples.outputs,
    isPublic: true,
    isFeatured: false,
    views: 0,
    upvotes: 0,
    sharedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// ClickHouse Schema for Leaderboard
// ============================================================================

export interface ClickHouseLeaderboardRow {
  id: string;
  agent_name: string;
  agent_description: string;
  project_id: string;
  user_id: string;
  display_name: string;
  display_author: string;
  total_runs: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  avg_cost_per_task: number;
  avg_latency_ms: number;
  total_cost: number;
  category: string;
  tags: string; // JSON array
  sample_inputs: string; // JSON array
  sample_outputs: string; // JSON array
  is_public: number; // 0 or 1
  is_featured: number;
  featured_rank: number;
  views: number;
  upvotes: number;
  shared_at: string;
  last_updated_at: string;
  created_at: string;
}

export function toClickHouseLeaderboardRow(entry: LeaderboardEntry): ClickHouseLeaderboardRow {
  return {
    id: entry.id,
    agent_name: entry.agentName,
    agent_description: entry.agentDescription || '',
    project_id: entry.projectId,
    user_id: entry.userId,
    display_name: entry.displayName,
    display_author: entry.displayAuthor,
    total_runs: entry.totalRuns,
    success_count: entry.successCount,
    failure_count: entry.failureCount,
    success_rate: entry.successRate,
    avg_cost_per_task: entry.avgCostPerTask,
    avg_latency_ms: entry.avgLatencyMs,
    total_cost: entry.totalCost,
    category: entry.category || '',
    tags: JSON.stringify(entry.tags),
    sample_inputs: JSON.stringify(entry.sampleInputs),
    sample_outputs: JSON.stringify(entry.sampleOutputs),
    is_public: entry.isPublic ? 1 : 0,
    is_featured: entry.isFeatured ? 1 : 0,
    featured_rank: entry.featuredRank || 0,
    views: entry.views,
    upvotes: entry.upvotes,
    shared_at: entry.sharedAt,
    last_updated_at: entry.lastUpdatedAt,
    created_at: entry.createdAt,
  };
}

export function fromClickHouseLeaderboardRow(row: ClickHouseLeaderboardRow): LeaderboardEntry {
  return {
    id: row.id,
    agentName: row.agent_name,
    agentDescription: row.agent_description || undefined,
    projectId: row.project_id,
    userId: row.user_id,
    displayName: row.display_name,
    displayAuthor: row.display_author,
    totalRuns: row.total_runs,
    successCount: row.success_count,
    failureCount: row.failure_count,
    successRate: row.success_rate,
    avgCostPerTask: row.avg_cost_per_task,
    avgLatencyMs: row.avg_latency_ms,
    totalCost: row.total_cost,
    category: row.category || undefined,
    tags: JSON.parse(row.tags),
    sampleInputs: JSON.parse(row.sample_inputs),
    sampleOutputs: JSON.parse(row.sample_outputs),
    isPublic: row.is_public === 1,
    isFeatured: row.is_featured === 1,
    featuredRank: row.featured_rank || undefined,
    views: row.views,
    upvotes: row.upvotes,
    sharedAt: row.shared_at,
    lastUpdatedAt: row.last_updated_at,
    createdAt: row.created_at,
  };
}

export function generateClickHouseLeaderboardInsert(entries: LeaderboardEntry[]): string {
  if (entries.length === 0) return '';

  const rows = entries.map(toClickHouseLeaderboardRow);
  const values = rows.map((row) => {
    const escapedDescription = row.agent_description.replace(/'/g, "''");
    const escapedTags = row.tags.replace(/'/g, "''");
    const escapedInputs = row.sample_inputs.replace(/'/g, "''");
    const escapedOutputs = row.sample_outputs.replace(/'/g, "''");
    const escapedCategory = row.category.replace(/'/g, "''");

    return `(
      '${row.id}',
      '${row.agent_name}',
      '${escapedDescription}',
      '${row.project_id}',
      '${row.user_id}',
      '${row.display_name}',
      '${row.display_author}',
      ${row.total_runs},
      ${row.success_count},
      ${row.failure_count},
      ${row.success_rate},
      ${row.avg_cost_per_task},
      ${row.avg_latency_ms},
      ${row.total_cost},
      '${escapedCategory}',
      '${escapedTags}',
      '${escapedInputs}',
      '${escapedOutputs}',
      ${row.is_public},
      ${row.is_featured},
      ${row.featured_rank},
      ${row.views},
      ${row.upvotes},
      '${row.shared_at}',
      '${row.last_updated_at}',
      '${row.created_at}'
    )`;
  }).join(',\n');

  return `
INSERT INTO leaderboard_entries (
  id, agent_name, agent_description, project_id, user_id,
  display_name, display_author, total_runs, success_count, failure_count,
  success_rate, avg_cost_per_task, avg_latency_ms, total_cost,
  category, tags, sample_inputs, sample_outputs,
  is_public, is_featured, featured_rank, views, upvotes,
  shared_at, last_updated_at, created_at
) VALUES ${values}
`.trim();
}

// ============================================================================
// OG Image Generation Helpers
// ============================================================================

/**
 * Generate URL for OG image API endpoint
 */
export function generateOGImageUrl(
  baseUrl: string,
  entryId: string,
  config: OGImageConfig
): string {
  const params = new URLSearchParams({
    id: entryId,
    name: config.agentName,
    author: config.displayAuthor,
    successRate: (config.successRate * 100).toFixed(1),
    avgCost: config.avgCost.toFixed(4),
    totalRuns: config.totalRuns.toString(),
    category: config.category || 'General',
  });

  return `${baseUrl}/api/og/leaderboard?${params.toString()}`;
}

/**
 * Generate metadata for social sharing
 */
export function generateSocialMetadata(entry: LeaderboardEntry, baseUrl: string) {
  const ogImageUrl = generateOGImageUrl(baseUrl, entry.id, {
    agentName: entry.displayName,
    displayAuthor: entry.displayAuthor,
    successRate: entry.successRate,
    avgCost: entry.avgCostPerTask,
    totalRuns: entry.totalRuns,
    category: entry.category,
  });

  const title = `${entry.displayName} - Agent Leaderboard`;
  const description = `Success rate: ${(entry.successRate * 100).toFixed(1)}% | Avg cost: $${entry.avgCostPerTask.toFixed(4)} | ${entry.totalRuns} runs`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// ============================================================================
// Validation
// ============================================================================

export function validateShareRequest(request: ShareAgentRequest): string | null {
  if (!request.projectId || request.projectId.trim() === '') {
    return 'Project ID is required';
  }

  if (!request.agentName || request.agentName.trim() === '') {
    return 'Agent name is required';
  }

  if (!request.runIds || request.runIds.length === 0) {
    return 'At least one run ID is required';
  }

  if (request.displayName && request.displayName.length > 100) {
    return 'Display name must be 100 characters or less';
  }

  if (request.description && request.description.length > 500) {
    return 'Description must be 500 characters or less';
  }

  if (request.tags && request.tags.length > 10) {
    return 'Maximum 10 tags allowed';
  }

  return null;
}
