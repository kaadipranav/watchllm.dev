/**
 * Agent Template Marketplace
 * 
 * Features:
 * - Template catalog (5-10 common patterns)
 * - One-click deploy with monitoring config
 * - Expected cost/performance estimates
 * - Conversion tracking
 * 
 * @feature AGENT_TEMPLATE_MARKETPLACE
 */

// ============================================================================
// Types
// ============================================================================

export interface TemplatePerformanceEstimate {
  expectedCostPerTaskUsd: number;
  expectedLatencyMs: number;
  expectedSuccessRate: number; // 0-1
  expectedTokensPerTask: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  alertThresholds: {
    minSuccessRate: number;
    maxLatencyMs: number;
    maxCostPerTaskUsd: number;
  };
  evaluationCriteria: Array<{
    type: string;
    name: string;
    description: string;
  }>;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  recommendedModels: string[];
  tools: string[];
  steps: string[];
  samplePrompt: string;
  sampleOutput: string;
  expectedPerformance: TemplatePerformanceEstimate;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  views: number;
  deploys: number;
}

export interface TemplateDeployment {
  id: string;
  templateId: string;
  projectId: string;
  deployedAt: string;
  monitoring: MonitoringConfig;
  dashboardUrl: string;
  status: 'active' | 'paused' | 'error';
}

export interface TemplateFilter {
  category?: string;
  tags?: string[];
  featuredOnly?: boolean;
  sortBy?: 'popular' | 'conversion' | 'recent';
  limit?: number;
  offset?: number;
}

export interface TemplateStats {
  totalTemplates: number;
  totalViews: number;
  totalDeploys: number;
  avgConversionRate: number;
  topConverting: Array<{
    templateId: string;
    name: string;
    conversionRate: number;
    views: number;
    deploys: number;
  }>;
}

// ============================================================================
// Template Catalog
// ============================================================================

const DEFAULT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'tpl_customer_support',
    name: 'Customer Support Agent',
    description: 'Handle FAQs, ticket triage, and escalation with sentiment-aware responses.',
    category: 'Customer Support',
    tags: ['support', 'faq', 'sentiment'],
    recommendedModels: ['gpt-4o-mini', 'gpt-4'],
    tools: ['knowledge_base', 'ticketing', 'crm_lookup'],
    steps: [
      'Classify intent',
      'Retrieve relevant FAQ or policy',
      'Generate response',
      'Escalate if needed',
    ],
    samplePrompt: 'Customer says: "My order arrived damaged." Respond and open a ticket.',
    sampleOutput: 'I’m sorry about the damage. I’ve opened ticket #1234 and will arrange a replacement.',
    expectedPerformance: {
      expectedCostPerTaskUsd: 0.025,
      expectedLatencyMs: 1200,
      expectedSuccessRate: 0.94,
      expectedTokensPerTask: 800,
    },
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    deploys: 0,
  },
  {
    id: 'tpl_research_summarizer',
    name: 'Research Summarizer',
    description: 'Summarize long documents into concise insights with citations.',
    category: 'Research',
    tags: ['summarization', 'citations', 'analysis'],
    recommendedModels: ['gpt-4o-mini', 'claude-3-haiku'],
    tools: ['web_fetch', 'pdf_parser', 'citation_extractor'],
    steps: [
      'Parse document',
      'Extract key points',
      'Summarize with citations',
    ],
    samplePrompt: 'Summarize the attached 20-page report in 5 bullet points.',
    sampleOutput: 'Summary: 1) Revenue grew 12%... (p.3)',
    expectedPerformance: {
      expectedCostPerTaskUsd: 0.045,
      expectedLatencyMs: 2400,
      expectedSuccessRate: 0.91,
      expectedTokensPerTask: 1800,
    },
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    deploys: 0,
  },
  {
    id: 'tpl_code_review',
    name: 'Code Review Assistant',
    description: 'Automated code review with security and style checks.',
    category: 'Engineering',
    tags: ['code', 'review', 'security'],
    recommendedModels: ['gpt-4', 'claude-3-opus'],
    tools: ['repo_reader', 'lint', 'security_scan'],
    steps: [
      'Analyze diffs',
      'Run static checks',
      'Provide review comments',
    ],
    samplePrompt: 'Review this PR and highlight risks or improvements.',
    sampleOutput: 'Found 2 security issues and 3 style inconsistencies.',
    expectedPerformance: {
      expectedCostPerTaskUsd: 0.08,
      expectedLatencyMs: 3000,
      expectedSuccessRate: 0.9,
      expectedTokensPerTask: 2500,
    },
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    deploys: 0,
  },
  {
    id: 'tpl_sales_qualifier',
    name: 'Sales Lead Qualifier',
    description: 'Qualify inbound leads and schedule meetings automatically.',
    category: 'Sales',
    tags: ['sales', 'crm', 'qualification'],
    recommendedModels: ['gpt-4o-mini'],
    tools: ['crm_lookup', 'calendar', 'emailer'],
    steps: [
      'Gather lead info',
      'Score lead',
      'Schedule or nurture',
    ],
    samplePrompt: 'Lead: "We need a solution for 500 seats." Qualify and schedule a demo.',
    sampleOutput: 'Qualified as high-intent; scheduled demo for next Wednesday.',
    expectedPerformance: {
      expectedCostPerTaskUsd: 0.015,
      expectedLatencyMs: 900,
      expectedSuccessRate: 0.92,
      expectedTokensPerTask: 600,
    },
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    deploys: 0,
  },
  {
    id: 'tpl_data_analyst',
    name: 'Data Analyst',
    description: 'Analyze datasets and produce executive insights and charts.',
    category: 'Analytics',
    tags: ['data', 'charts', 'insights'],
    recommendedModels: ['gpt-4', 'gpt-4o-mini'],
    tools: ['sql_query', 'csv_parser', 'chart_generator'],
    steps: [
      'Query dataset',
      'Compute KPIs',
      'Generate insights',
      'Create charts',
    ],
    samplePrompt: 'Analyze Q4 sales CSV and summarize key trends.',
    sampleOutput: 'Revenue up 18% QoQ; highest growth in SMB segment.',
    expectedPerformance: {
      expectedCostPerTaskUsd: 0.06,
      expectedLatencyMs: 2800,
      expectedSuccessRate: 0.9,
      expectedTokensPerTask: 2100,
    },
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    deploys: 0,
  },
  {
    id: 'tpl_marketing_copy',
    name: 'Marketing Copy Generator',
    description: 'Generate ad copy, landing page text, and A/B variants.',
    category: 'Marketing',
    tags: ['copywriting', 'ads', 'seo'],
    recommendedModels: ['gpt-4o-mini'],
    tools: ['brand_guidelines', 'keyword_research'],
    steps: [
      'Analyze product',
      'Draft copy',
      'Generate variants',
    ],
    samplePrompt: 'Write 3 ad variants for a productivity app targeting founders.',
    sampleOutput: 'Variant A: "Launch faster with..."',
    expectedPerformance: {
      expectedCostPerTaskUsd: 0.012,
      expectedLatencyMs: 700,
      expectedSuccessRate: 0.93,
      expectedTokensPerTask: 500,
    },
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    deploys: 0,
  },
  {
    id: 'tpl_ops_incident',
    name: 'Ops Incident Triage',
    description: 'Detect incidents, summarize logs, and recommend remediation steps.',
    category: 'Operations',
    tags: ['incident', 'logs', 'oncall'],
    recommendedModels: ['gpt-4', 'gpt-4o-mini'],
    tools: ['log_search', 'pagerduty', 'runbook'],
    steps: [
      'Parse alerts',
      'Summarize logs',
      'Suggest fix',
      'Escalate if critical',
    ],
    samplePrompt: 'Alert: 500 errors spiking on /checkout. Triage and recommend actions.',
    sampleOutput: 'Root cause likely DB timeout. Suggested: scale read replicas.',
    expectedPerformance: {
      expectedCostPerTaskUsd: 0.05,
      expectedLatencyMs: 2000,
      expectedSuccessRate: 0.88,
      expectedTokensPerTask: 1600,
    },
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    deploys: 0,
  },
  {
    id: 'tpl_hr_recruiter',
    name: 'Recruiting Screener',
    description: 'Screen resumes and schedule interviews with top candidates.',
    category: 'HR',
    tags: ['recruiting', 'screening', 'interviews'],
    recommendedModels: ['gpt-4o-mini'],
    tools: ['resume_parser', 'calendar', 'emailer'],
    steps: [
      'Parse resume',
      'Score fit',
      'Schedule interview',
    ],
    samplePrompt: 'Screen candidate for backend engineer role and schedule next steps.',
    sampleOutput: 'Candidate scored 86/100. Interview scheduled for Friday.',
    expectedPerformance: {
      expectedCostPerTaskUsd: 0.02,
      expectedLatencyMs: 1100,
      expectedSuccessRate: 0.91,
      expectedTokensPerTask: 650,
    },
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    deploys: 0,
  },
];

// ============================================================================
// Helpers
// ============================================================================

function buildMonitoringConfig(template: AgentTemplate): MonitoringConfig {
  return {
    enabled: true,
    alertThresholds: {
      minSuccessRate: Math.max(0.75, template.expectedPerformance.expectedSuccessRate - 0.1),
      maxLatencyMs: Math.round(template.expectedPerformance.expectedLatencyMs * 1.5),
      maxCostPerTaskUsd: Number((template.expectedPerformance.expectedCostPerTaskUsd * 1.5).toFixed(4)),
    },
    evaluationCriteria: [
      {
        type: 'contains',
        name: 'Response completeness',
        description: 'Ensure response includes required details',
      },
      {
        type: 'toxicity',
        name: 'Toxicity Check',
        description: 'Detect unsafe or toxic content',
      },
      {
        type: 'latency_max',
        name: 'Latency Threshold',
        description: 'Ensure latency stays within expected range',
      },
    ],
  };
}

function calculateConversionRate(views: number, deploys: number): number {
  if (views === 0) return 0;
  return deploys / views;
}

// ============================================================================
// Store
// ============================================================================

export class AgentTemplateStore {
  private templates: Map<string, AgentTemplate> = new Map();
  private deployments: Map<string, TemplateDeployment> = new Map();

  constructor(initialTemplates: AgentTemplate[] = DEFAULT_TEMPLATES) {
    for (const template of initialTemplates) {
      this.templates.set(template.id, template);
    }
  }

  getAll(): AgentTemplate[] {
    return Array.from(this.templates.values());
  }

  get(id: string): AgentTemplate | undefined {
    return this.templates.get(id);
  }

  getFeatured(): AgentTemplate[] {
    return this.getAll().filter((t) => t.featured);
  }

  filter(filter: TemplateFilter): AgentTemplate[] {
    let results = this.getAll();

    if (filter.category) {
      results = results.filter((t) => t.category === filter.category);
    }

    if (filter.tags && filter.tags.length > 0) {
      results = results.filter((t) => filter.tags!.some((tag) => t.tags.includes(tag)));
    }

    if (filter.featuredOnly) {
      results = results.filter((t) => t.featured);
    }

    const sortBy = filter.sortBy || 'popular';
    switch (sortBy) {
      case 'conversion':
        results.sort((a, b) =>
          calculateConversionRate(b.views, b.deploys) - calculateConversionRate(a.views, a.deploys)
        );
        break;
      case 'recent':
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'popular':
      default:
        results.sort((a, b) => b.views - a.views);
        break;
    }

    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    return results.slice(offset, offset + limit);
  }

  incrementView(templateId: string): void {
    const template = this.templates.get(templateId);
    if (!template) return;

    template.views += 1;
    template.updatedAt = new Date().toISOString();
    this.templates.set(templateId, template);
  }

  recordDeployment(templateId: string, projectId: string): TemplateDeployment | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    template.deploys += 1;
    template.updatedAt = new Date().toISOString();
    this.templates.set(templateId, template);

    const deployment: TemplateDeployment = {
      id: `tpl_dep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      templateId,
      projectId,
      deployedAt: new Date().toISOString(),
      monitoring: buildMonitoringConfig(template),
      dashboardUrl: `https://watchllm.com/dashboard/observability/agents?template=${templateId}`,
      status: 'active',
    };

    this.deployments.set(deployment.id, deployment);
    return deployment;
  }

  getDeploymentsByProject(projectId: string): TemplateDeployment[] {
    return Array.from(this.deployments.values()).filter((d) => d.projectId === projectId);
  }

  getStats(): TemplateStats {
    const templates = this.getAll();
    const totalViews = templates.reduce((sum, t) => sum + t.views, 0);
    const totalDeploys = templates.reduce((sum, t) => sum + t.deploys, 0);
    const avgConversionRate = templates.length
      ? templates.reduce((sum, t) => sum + calculateConversionRate(t.views, t.deploys), 0) / templates.length
      : 0;

    const topConverting = [...templates]
      .sort((a, b) =>
        calculateConversionRate(b.views, b.deploys) - calculateConversionRate(a.views, a.deploys)
      )
      .slice(0, 5)
      .map((t) => ({
        templateId: t.id,
        name: t.name,
        conversionRate: calculateConversionRate(t.views, t.deploys),
        views: t.views,
        deploys: t.deploys,
      }));

    return {
      totalTemplates: templates.length,
      totalViews,
      totalDeploys,
      avgConversionRate,
      topConverting,
    };
  }
}
