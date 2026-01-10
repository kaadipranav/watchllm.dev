import AgentRunDebugView from '@/components/agent-debugger/agent-run-debug-view';

/**
 * Agent Run Debug Detail Page
 * 
 * Shows full debug breakdown for a specific agent run:
 * - Cost summary (total, wasted, saved, cache hit rate)
 * - Step-by-step timeline with expandable details
 * - Flags and warnings
 * - Raw payloads and explanations
 * 
 * UX: Money → Decisions → Outcomes
 * 
 * @feature AGENT_DEBUGGER_V1
 */

interface PageProps {
  params: {
    runId: string;
  };
}

export default function AgentRunDebugPage({ params }: PageProps) {
  return <AgentRunDebugView runId={params.runId} />;
}
