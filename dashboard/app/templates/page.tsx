/**
 * Agent Template Marketplace
 * 
 * Showcases common agent patterns with expected cost/performance
 */

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const fallbackTemplates = [
  {
    id: 'tpl_customer_support',
    name: 'Customer Support Agent',
    category: 'Customer Support',
    description: 'Handle FAQs, ticket triage, and escalation with sentiment-aware responses.',
    tags: ['support', 'faq', 'sentiment'],
    expectedCost: 0.025,
    expectedLatency: 1200,
    expectedSuccessRate: 0.94,
    views: 1240,
    deploys: 210,
  },
  {
    id: 'tpl_research_summarizer',
    name: 'Research Summarizer',
    category: 'Research',
    description: 'Summarize long documents into concise insights with citations.',
    tags: ['summarization', 'citations', 'analysis'],
    expectedCost: 0.045,
    expectedLatency: 2400,
    expectedSuccessRate: 0.91,
    views: 980,
    deploys: 160,
  },
  {
    id: 'tpl_code_review',
    name: 'Code Review Assistant',
    category: 'Engineering',
    description: 'Automated code review with security and style checks.',
    tags: ['code', 'review', 'security'],
    expectedCost: 0.08,
    expectedLatency: 3000,
    expectedSuccessRate: 0.9,
    views: 1120,
    deploys: 140,
  },
  {
    id: 'tpl_sales_qualifier',
    name: 'Sales Lead Qualifier',
    category: 'Sales',
    description: 'Qualify inbound leads and schedule meetings automatically.',
    tags: ['sales', 'crm', 'qualification'],
    expectedCost: 0.015,
    expectedLatency: 900,
    expectedSuccessRate: 0.92,
    views: 760,
    deploys: 190,
  },
  {
    id: 'tpl_data_analyst',
    name: 'Data Analyst',
    category: 'Analytics',
    description: 'Analyze datasets and produce executive insights and charts.',
    tags: ['data', 'charts', 'insights'],
    expectedCost: 0.06,
    expectedLatency: 2800,
    expectedSuccessRate: 0.9,
    views: 540,
    deploys: 80,
  },
  {
    id: 'tpl_marketing_copy',
    name: 'Marketing Copy Generator',
    category: 'Marketing',
    description: 'Generate ad copy, landing page text, and A/B variants.',
    tags: ['copywriting', 'ads', 'seo'],
    expectedCost: 0.012,
    expectedLatency: 700,
    expectedSuccessRate: 0.93,
    views: 680,
    deploys: 130,
  },
  {
    id: 'tpl_ops_incident',
    name: 'Ops Incident Triage',
    category: 'Operations',
    description: 'Detect incidents, summarize logs, and recommend remediation steps.',
    tags: ['incident', 'logs', 'oncall'],
    expectedCost: 0.05,
    expectedLatency: 2000,
    expectedSuccessRate: 0.88,
    views: 460,
    deploys: 60,
  },
  {
    id: 'tpl_hr_recruiter',
    name: 'Recruiting Screener',
    category: 'HR',
    description: 'Screen resumes and schedule interviews with top candidates.',
    tags: ['recruiting', 'screening', 'interviews'],
    expectedCost: 0.02,
    expectedLatency: 1100,
    expectedSuccessRate: 0.91,
    views: 520,
    deploys: 95,
  },
];

type TemplateItem = typeof fallbackTemplates[number];

function conversionRate(views: number, deploys: number) {
  return views === 0 ? 0 : (deploys / views) * 100;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>(fallbackTemplates);
  const [projectId, setProjectId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiBase = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_WORKER_URL ||
      process.env.NEXT_PUBLIC_OBSERVABILITY_URL ||
      ''
    );
  }, []);

  const apiKey = useMemo(() => {
    if (!projectId) return '';
    return localStorage.getItem(`project_${projectId}_api_key`) || '';
  }, [projectId]);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!apiKey) return;

      try {
        const response = await fetch(`${apiBase}/v1/agent-templates`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data?.templates) {
          const mapped = data.templates.map((tpl: any) => ({
            id: tpl.id,
            name: tpl.name,
            category: tpl.category,
            description: tpl.description,
            tags: tpl.tags || [],
            expectedCost: tpl.expectedPerformance?.expectedCostPerTaskUsd || 0,
            expectedLatency: tpl.expectedPerformance?.expectedLatencyMs || 0,
            expectedSuccessRate: tpl.expectedPerformance?.expectedSuccessRate || 0,
            views: tpl.views || 0,
            deploys: tpl.deploys || 0,
          }));

          setTemplates(mapped);
        }
      } catch (error) {
        // Keep fallback data on failure
      }
    };

    loadTemplates();
  }, [apiBase, apiKey]);

  const handleView = async (templateId: string) => {
    if (!apiKey) {
      setStatusMessage('Add a project ID with a valid API key to track views.');
      return;
    }

    try {
      await fetch(`${apiBase}/v1/agent-templates/${templateId}/view`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    } catch (error) {
      // Ignore view tracking errors
    }
  };

  const handleDeploy = async (templateId: string) => {
    if (!projectId) {
      setStatusMessage('Enter a project ID to deploy a template.');
      return;
    }

    if (!apiKey) {
      setStatusMessage('Missing API key for this project. Add it in API Keys.');
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`${apiBase}/v1/agent-templates/${templateId}/deploy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        setStatusMessage('Failed to deploy template.');
        return;
      }

      const data = await response.json();
      if (data?.deployment?.dashboardUrl) {
        setStatusMessage('Template deployed with monitoring enabled.');
      }

      setTemplates((prev) =>
        prev.map((tpl) =>
          tpl.id === templateId
            ? { ...tpl, deploys: tpl.deploys + 1 }
            : tpl
        )
      );
    } catch (error) {
      setStatusMessage('Deployment failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-500">
              WatchLLM
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/leaderboard" className="text-slate-300 hover:text-white transition-colors">
                Leaderboard
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium mb-6">
            🧩 Agent Template Marketplace
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Deploy Proven Agent Patterns
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Choose from battle-tested templates with expected cost and performance estimates. Deploy in one click with monitoring enabled.
          </p>
        </div>

        {/* Project Selector */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm text-slate-400 mb-2">Project ID (for deployment)</label>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="proj_123..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div className="text-sm text-slate-400">
            {apiKey ? 'API key detected for this project.' : 'API key required for deploy & view tracking.'}
          </div>
        </div>

        {statusMessage && (
          <div className="mb-6 text-sm text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
            {statusMessage}
          </div>
        )}

        {/* Template Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{tpl.name}</h2>
                  <div className="text-slate-400 text-sm">{tpl.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-500 font-bold text-lg">
                    {(tpl.expectedSuccessRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400">Expected success</div>
                </div>
              </div>

              <p className="text-slate-300 mb-4">{tpl.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {tpl.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-400 text-xs mb-1">Cost/Task</div>
                  <div className="text-blue-400 font-bold">${tpl.expectedCost.toFixed(3)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-400 text-xs mb-1">Latency</div>
                  <div className="text-purple-400 font-bold">{tpl.expectedLatency}ms</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-400 text-xs mb-1">Conversion</div>
                  <div className="text-green-400 font-bold">
                    {conversionRate(tpl.views, tpl.deploys).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-400 mb-6">
                <span>{tpl.views.toLocaleString()} views</span>
                <span>{tpl.deploys.toLocaleString()} deployments</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDeploy(tpl.id)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Deploying...' : 'Deploy with Monitoring'}
                </button>
                <button
                  onClick={() => handleView(tpl.id)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-10">
            <h2 className="text-3xl font-bold text-white mb-3">Have a template to share?</h2>
            <p className="text-slate-300 mb-6">Publish your agent and track conversions in the marketplace.</p>
            <Link href="/dashboard" className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
              Submit Template →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
