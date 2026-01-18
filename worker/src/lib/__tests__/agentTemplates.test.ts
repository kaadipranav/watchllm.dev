/**
 * Agent Template Marketplace Tests
 * 
 * @feature AGENT_TEMPLATE_MARKETPLACE
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AgentTemplateStore,
  type AgentTemplate,
} from '../agentTemplates';

function createTemplate(overrides: Partial<AgentTemplate> = {}): AgentTemplate {
  return {
    id: `tpl_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Template',
    description: 'Test description',
    category: 'Testing',
    tags: ['test'],
    recommendedModels: ['gpt-4o-mini'],
    tools: ['tool_a'],
    steps: ['Step 1'],
    samplePrompt: 'Test prompt',
    sampleOutput: 'Test output',
    expectedPerformance: {
      expectedCostPerTaskUsd: 0.01,
      expectedLatencyMs: 1000,
      expectedSuccessRate: 0.9,
      expectedTokensPerTask: 500,
    },
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    deploys: 0,
    ...overrides,
  };
}

describe('AgentTemplateStore', () => {
  let store: AgentTemplateStore;

  beforeEach(() => {
    store = new AgentTemplateStore([]);
  });

  it('should return empty list by default', () => {
    expect(store.getAll()).toHaveLength(0);
  });

  it('should return templates by id', () => {
    const template = createTemplate({ id: 'tpl_1' });
    store = new AgentTemplateStore([template]);

    expect(store.get('tpl_1')?.id).toBe('tpl_1');
  });

  it('should filter by category', () => {
    const t1 = createTemplate({ id: 't1', category: 'Support' });
    const t2 = createTemplate({ id: 't2', category: 'Sales' });
    store = new AgentTemplateStore([t1, t2]);

    const results = store.filter({ category: 'Support' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('t1');
  });

  it('should filter by tags', () => {
    const t1 = createTemplate({ id: 't1', tags: ['alpha'] });
    const t2 = createTemplate({ id: 't2', tags: ['beta'] });
    store = new AgentTemplateStore([t1, t2]);

    const results = store.filter({ tags: ['beta'] });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('t2');
  });

  it('should filter featured templates', () => {
    const t1 = createTemplate({ id: 't1', featured: true });
    const t2 = createTemplate({ id: 't2', featured: false });
    store = new AgentTemplateStore([t1, t2]);

    const results = store.filter({ featuredOnly: true });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('t1');
  });

  it('should sort by popularity', () => {
    const t1 = createTemplate({ id: 't1', views: 10 });
    const t2 = createTemplate({ id: 't2', views: 50 });
    const t3 = createTemplate({ id: 't3', views: 30 });
    store = new AgentTemplateStore([t1, t2, t3]);

    const results = store.filter({ sortBy: 'popular' });
    expect(results[0].id).toBe('t2');
    expect(results[1].id).toBe('t3');
    expect(results[2].id).toBe('t1');
  });

  it('should sort by conversion', () => {
    const t1 = createTemplate({ id: 't1', views: 100, deploys: 20 }); // 0.2
    const t2 = createTemplate({ id: 't2', views: 50, deploys: 25 }); // 0.5
    const t3 = createTemplate({ id: 't3', views: 200, deploys: 10 }); // 0.05
    store = new AgentTemplateStore([t1, t2, t3]);

    const results = store.filter({ sortBy: 'conversion' });
    expect(results[0].id).toBe('t2');
    expect(results[1].id).toBe('t1');
    expect(results[2].id).toBe('t3');
  });

  it('should paginate results', () => {
    const templates = Array.from({ length: 10 }, (_, i) => createTemplate({ id: `t${i}` }));
    store = new AgentTemplateStore(templates);

    const page1 = store.filter({ limit: 3, offset: 0 });
    const page2 = store.filter({ limit: 3, offset: 3 });

    expect(page1).toHaveLength(3);
    expect(page2).toHaveLength(3);
    expect(page1[0].id).not.toBe(page2[0].id);
  });

  it('should increment views', () => {
    const template = createTemplate({ id: 't1' });
    store = new AgentTemplateStore([template]);

    store.incrementView('t1');
    expect(store.get('t1')?.views).toBe(1);
  });

  it('should record deployments with monitoring', () => {
    const template = createTemplate({ id: 't1' });
    store = new AgentTemplateStore([template]);

    const deployment = store.recordDeployment('t1', 'proj_1');

    expect(deployment).toBeDefined();
    expect(deployment?.templateId).toBe('t1');
    expect(deployment?.projectId).toBe('proj_1');
    expect(deployment?.monitoring.enabled).toBe(true);
    expect(store.get('t1')?.deploys).toBe(1);
  });

  it('should return deployments by project', () => {
    const template = createTemplate({ id: 't1' });
    store = new AgentTemplateStore([template]);

    store.recordDeployment('t1', 'proj_1');
    store.recordDeployment('t1', 'proj_2');

    const proj1Deploys = store.getDeploymentsByProject('proj_1');
    expect(proj1Deploys).toHaveLength(1);
  });

  it('should compute stats correctly', () => {
    const t1 = createTemplate({ id: 't1', views: 100, deploys: 20 });
    const t2 = createTemplate({ id: 't2', views: 50, deploys: 10 });
    store = new AgentTemplateStore([t1, t2]);

    const stats = store.getStats();

    expect(stats.totalTemplates).toBe(2);
    expect(stats.totalViews).toBe(150);
    expect(stats.totalDeploys).toBe(30);
    expect(stats.avgConversionRate).toBeGreaterThan(0);
    expect(stats.topConverting.length).toBeGreaterThan(0);
  });
});
