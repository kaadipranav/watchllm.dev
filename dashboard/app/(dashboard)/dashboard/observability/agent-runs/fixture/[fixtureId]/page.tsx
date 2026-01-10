import AgentRunDebugView from '@/components/agent-debugger/agent-run-debug-view';

/**
 * Agent Run Fixture Page
 * 
 * Uses the same debug view as regular runs, but fetches data from fixtures.
 * This allows us to demo the feature without real data.
 * 
 * @feature AGENT_DEBUGGER_V1
 */

interface PageProps {
  params: {
    fixtureId: string;
  };
}

export default function AgentRunFixturePage({ params }: PageProps) {
  return <AgentRunDebugView runId={params.fixtureId} isFixture={true} />;
}
