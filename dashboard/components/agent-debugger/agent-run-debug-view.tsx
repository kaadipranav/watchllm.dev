'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Clock,
  TrendingDown,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Wrench,
  Bot,
  RefreshCw,
  User,
  AlertCircle,
} from 'lucide-react';
import { formatRelativeTime, formatCurrency, cn } from '@/lib/utils';
import type { 
  AgentDebugViewModel, 
  StepDebugView, 
  Flag, 
  StepType,
  CostSummary,
} from '@/lib/agent-debugger';

/**
 * Agent Run Debug View Component
 * 
 * Shared component used by both regular runs and fixtures.
 * Displays detailed debug information for a single agent run.
 * 
 * @feature AGENT_DEBUGGER_V1
 */

interface AgentRunDebugViewProps {
  runId: string;
  isFixture?: boolean;
}

export default function AgentRunDebugView({ runId, isFixture = false }: AgentRunDebugViewProps) {
  const [debug, setDebug] = useState<AgentDebugViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [showHowCalculated, setShowHowCalculated] = useState(false);

  useEffect(() => {
    fetchDebugData();
  }, [runId]);

  const fetchDebugData = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = isFixture 
        ? `/api/agent-runs/fixture/${runId}`
        : `/api/agent-runs/${runId}/debug`;

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          const data = await response.json();
          setError(data.error || 'Run not found');
        } else {
          throw new Error('Failed to fetch debug data');
        }
        return;
      }

      const data = await response.json();
      setDebug(data.debug);
    } catch (err) {
      console.error('Failed to fetch debug data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load debug data');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (debug) {
      setExpandedSteps(new Set(debug.steps.map((_, i) => i)));
    }
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  const downloadJson = () => {
    if (!debug) return;
    const blob = new Blob([JSON.stringify(debug, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-run-${runId}-debug.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <Link href="/dashboard/observability/agent-runs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Runs
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!debug) {
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/observability/agent-runs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {debug.summary.agent_name}
            </h1>
            <p className="text-sm text-text-muted">
              Run {runId.slice(0, 8)}... • {debug.summary.total_steps} steps • {formatRelativeTime(debug.summary.started_at)}
              {isFixture && <Badge variant="outline" className="ml-2">Fixture</Badge>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadJson}>
            <Download className="h-4 w-4 mr-2" />
            Download JSON
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <CostSummaryCard 
        summary={debug.summary} 
        onShowHowCalculated={() => setShowHowCalculated(true)} 
      />

      {/* Flags Summary */}
      {debug.summary.flags.length > 0 && (
        <FlagsSummary flags={debug.summary.flags} />
      )}

      {/* Timeline Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Step Timeline</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="space-y-3">
        {debug.steps.map((step, index) => (
          <StepCard
            key={index}
            step={step}
            index={index}
            isExpanded={expandedSteps.has(index)}
            onToggle={() => toggleStep(index)}
            totalCost={debug.summary.cost.total_cost_usd}
          />
        ))}
      </div>

      {/* How Calculated Modal */}
      {showHowCalculated && (
        <HowCalculatedModal 
          cost={debug.summary.cost}
          onClose={() => setShowHowCalculated(false)} 
        />
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface CostSummaryCardProps {
  summary: AgentDebugViewModel['summary'];
  onShowHowCalculated: () => void;
}

function CostSummaryCard({ summary, onShowHowCalculated }: CostSummaryCardProps) {
  const { cost } = summary;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Total Cost */}
          <MetricBox
            label="Total Run Cost"
            value={formatCurrency(cost.total_cost_usd)}
            icon={<DollarSign className="h-4 w-4 text-accent-primary" />}
            tooltip="Sum of all API costs for this run"
          />
          
          {/* Wasted Spend */}
          <MetricBox
            label="Wasted Spend"
            value={formatCurrency(cost.wasted_spend_usd)}
            icon={<TrendingDown className="h-4 w-4 text-accent-error" />}
            tooltip="Cost from retries and repeated calls"
            highlight={cost.wasted_spend_usd > 0 ? 'error' : undefined}
          />
          
          {/* Amount Saved */}
          <MetricBox
            label="Amount Saved"
            value={formatCurrency(cost.amount_saved_usd)}
            icon={<Zap className="h-4 w-4 text-accent-success" />}
            tooltip="Savings from cache hits"
            highlight={cost.amount_saved_usd > 0 ? 'success' : undefined}
          />
          
          {/* Cache Hit Rate */}
          <MetricBox
            label="Cache Hit Rate"
            value={`${cost.cache_hit_rate.toFixed(1)}%`}
            icon={<RefreshCw className="h-4 w-4 text-accent-warning" />}
            tooltip="Percentage of cacheable requests that hit cache"
          />
        </div>
        
        <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>Duration: {summary.duration_ms ? `${(summary.duration_ms / 1000).toFixed(1)}s` : 'N/A'}</span>
            <span>•</span>
            <span>Status: <Badge variant={summary.status === 'completed' ? 'success' : summary.status === 'failed' ? 'error' : 'default'}>{summary.status}</Badge></span>
          </div>
          <Button variant="ghost" size="sm" onClick={onShowHowCalculated}>
            <Info className="h-3 w-3 mr-1" />
            How calculated
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricBoxProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tooltip: string;
  highlight?: 'success' | 'error';
}

function MetricBox({ label, value, icon, tooltip, highlight }: MetricBoxProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs text-text-muted">
        {icon}
        <span>{label}</span>
        <button className="ml-1 hover:text-text-secondary" title={tooltip}>
          <Info className="h-3 w-3" />
        </button>
      </div>
      <div className={cn(
        "text-2xl font-bold font-mono",
        highlight === 'success' && "text-accent-success",
        highlight === 'error' && "text-accent-error",
        !highlight && "text-text-primary"
      )}>
        {value}
      </div>
    </div>
  );
}

interface FlagsSummaryProps {
  flags: Flag[];
}

function FlagsSummary({ flags }: FlagsSummaryProps) {
  const errorFlags = flags.filter(f => f.severity === 'error');
  const warningFlags = flags.filter(f => f.severity === 'warning');
  const infoFlags = flags.filter(f => f.severity === 'info');

  return (
    <Alert className="border-accent-warning/20 bg-accent-warning/5">
      <AlertTriangle className="h-4 w-4 text-accent-warning" />
      <AlertTitle className="text-accent-warning">
        {flags.length} issue{flags.length !== 1 ? 's' : ''} detected
      </AlertTitle>
      <AlertDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          {errorFlags.map((flag, i) => (
            <Badge key={`error-${i}`} variant="error">{flag.type.replace(/_/g, ' ')}</Badge>
          ))}
          {warningFlags.map((flag, i) => (
            <Badge key={`warning-${i}`} variant="warning">{flag.type.replace(/_/g, ' ')}</Badge>
          ))}
          {infoFlags.map((flag, i) => (
            <Badge key={`info-${i}`} variant="default">{flag.type.replace(/_/g, ' ')}</Badge>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface StepCardProps {
  step: StepDebugView;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  totalCost: number;
}

function StepCard({ step, index, isExpanded, onToggle, totalCost }: StepCardProps) {
  const StepIcon = getStepIcon(step.type);
  const hasFlags = step.flags && step.flags.length > 0;
  
  return (
    <div className={cn(
      "border rounded-lg transition-all",
      hasFlags && step.flags?.some(f => f.severity === 'error') && "border-accent-error/30",
      hasFlags && step.flags?.some(f => f.severity === 'warning') && !step.flags?.some(f => f.severity === 'error') && "border-accent-warning/30",
      !hasFlags && "border-border-subtle"
    )}>
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-bg-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-muted" />
          )}
          <div className={cn(
            "p-2 rounded-lg",
            getStepTypeColor(step.type)
          )}>
            <StepIcon className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-muted">[{step.step_index}]</span>
              <span className="font-medium text-text-primary">{formatStepType(step.type)}</span>
              {step.tool && (
                <Badge variant="outline" className="text-xs">{step.tool}</Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary truncate max-w-[500px]">
              {step.summary || 'No summary'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasFlags && (
            <div className="flex gap-1">
              {step.flags?.map((flag, i) => (
                <FlagBadge key={i} flag={flag} />
              ))}
            </div>
          )}
          {step.cache_hit && (
            <Badge variant="success" className="text-xs">cached</Badge>
          )}
          <div className="text-right min-w-[80px]">
            <div className="text-sm font-mono text-text-primary">
              {formatCurrency(step.api_cost_usd || 0)}
            </div>
            <div className="text-xs text-text-muted">
              {step.cost_percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border-subtle">
          {/* Tool Args */}
          {step.tool_args && Object.keys(step.tool_args).length > 0 && (
            <div className="pt-4">
              <h4 className="text-xs font-medium text-text-muted mb-2">Tool Arguments</h4>
              <pre className="bg-bg-elevated p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(step.tool_args, null, 2)}
              </pre>
            </div>
          )}

          {/* Tool Output */}
          {step.tool_output_summary && (
            <div>
              <h4 className="text-xs font-medium text-text-muted mb-2">Tool Output</h4>
              <p className="text-sm text-text-secondary bg-bg-elevated p-3 rounded">
                {step.tool_output_summary}
              </p>
            </div>
          )}

          {/* Why Explanation */}
          {step.why_explanation && (
            <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-accent-primary mt-0.5" />
                <div>
                  <h4 className="text-xs font-medium text-accent-primary mb-1 flex items-center gap-2">
                    Why this happened
                    <Badge variant="outline" className="text-[10px]">
                      {step.explain_source} • {((step.explain_confidence || 0) * 100).toFixed(0)}% confidence
                    </Badge>
                  </h4>
                  <p className="text-sm text-text-secondary">
                    {step.why_explanation}
                  </p>
                  {step.explain_rules_matched && step.explain_rules_matched.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {step.explain_rules_matched.map(rule => (
                        <Badge key={rule} variant="outline" className="text-[10px]">{rule}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Raw Payload */}
          {step.raw && (
            <details className="group">
              <summary className="text-xs font-medium text-text-muted cursor-pointer hover:text-text-secondary">
                View raw payload
              </summary>
              <pre className="mt-2 bg-bg-elevated p-3 rounded text-xs overflow-x-auto max-h-[200px]">
                {step.raw}
              </pre>
            </details>
          )}

          {/* Flags Detail */}
          {hasFlags && (
            <div>
              <h4 className="text-xs font-medium text-text-muted mb-2">Flags</h4>
              <div className="space-y-2">
                {step.flags?.map((flag, i) => (
                  <div key={i} className={cn(
                    "text-sm p-2 rounded flex items-start gap-2",
                    flag.severity === 'error' && "bg-accent-error/10 text-accent-error",
                    flag.severity === 'warning' && "bg-accent-warning/10 text-accent-warning",
                    flag.severity === 'info' && "bg-bg-elevated text-text-secondary"
                  )}>
                    <FlagIcon severity={flag.severity} />
                    <div>
                      <span className="font-medium">{flag.type.replace(/_/g, ' ')}</span>
                      <span className="mx-1">—</span>
                      <span>{flag.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-text-muted pt-2 border-t border-border-subtle">
            <span>Timestamp: {new Date(step.timestamp).toLocaleString()}</span>
            {step.duration_ms !== undefined && (
              <span>Duration: {step.duration_ms}ms</span>
            )}
            {step.token_cost !== undefined && step.token_cost > 0 && (
              <span>Tokens: {step.token_cost}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface HowCalculatedModalProps {
  cost: CostSummary;
  onClose: () => void;
}

function HowCalculatedModal({ cost, onClose }: HowCalculatedModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Costs Are Calculated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-text-primary">Total Run Cost</h4>
            <p className="text-sm text-text-secondary mt-1">
              Sum of <code className="bg-bg-elevated px-1 rounded">api_cost_usd</code> from all steps.
              If not available, estimated from token counts using provider pricing.
            </p>
            <p className="text-xs text-text-muted mt-1">
              Breakdown: Tool calls ({formatCurrency(cost.breakdown.tool_calls_cost)}) + 
              Model responses ({formatCurrency(cost.breakdown.model_responses_cost)}) + 
              Retries ({formatCurrency(cost.breakdown.retries_cost)})
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-text-primary">Wasted Spend</h4>
            <p className="text-sm text-text-secondary mt-1">
              Cost attributed to retries, repeated tool calls with identical outputs,
              and cache misses that immediately follow failed attempts.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-text-primary">Amount Saved</h4>
            <p className="text-sm text-text-secondary mt-1">
              For cache hits, the full <code className="bg-bg-elevated px-1 rounded">api_cost_usd</code> 
              of that step is counted as saved. Formula: <code className="bg-bg-elevated px-1 rounded">
              saved = api_cost_usd × cache_hit</code>
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-text-primary">Cache Hit Rate</h4>
            <p className="text-sm text-text-secondary mt-1">
              Percentage of cacheable steps (tool calls, decisions, model responses) 
              that had <code className="bg-bg-elevated px-1 rounded">cache_hit: true</code>.
            </p>
          </div>
          
          <Button className="w-full" onClick={onClose}>Close</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function getStepIcon(type: StepType) {
  switch (type) {
    case 'user_input':
      return User;
    case 'decision':
      return Bot;
    case 'tool_call':
      return Wrench;
    case 'tool_result':
      return CheckCircle;
    case 'model_response':
      return MessageSquare;
    case 'retry':
      return RefreshCw;
    case 'error':
      return XCircle;
    default:
      return Info;
  }
}

function getStepTypeColor(type: StepType) {
  switch (type) {
    case 'user_input':
      return 'bg-blue-500/10 text-blue-500';
    case 'decision':
      return 'bg-purple-500/10 text-purple-500';
    case 'tool_call':
      return 'bg-orange-500/10 text-orange-500';
    case 'tool_result':
      return 'bg-green-500/10 text-green-500';
    case 'model_response':
      return 'bg-cyan-500/10 text-cyan-500';
    case 'retry':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'error':
      return 'bg-red-500/10 text-red-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
}

function formatStepType(type: StepType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function FlagBadge({ flag }: { flag: Flag }) {
  const variant = flag.severity === 'error' ? 'error' : flag.severity === 'warning' ? 'warning' : 'default';
  return (
    <Badge variant={variant as any} className="text-[10px]">
      {flag.severity === 'error' ? '⚠️' : flag.severity === 'warning' ? '⚡' : 'ℹ️'}
    </Badge>
  );
}

function FlagIcon({ severity }: { severity: Flag['severity'] }) {
  if (severity === 'error') return <AlertCircle className="h-4 w-4 shrink-0" />;
  if (severity === 'warning') return <AlertTriangle className="h-4 w-4 shrink-0" />;
  return <Info className="h-4 w-4 shrink-0" />;
}
