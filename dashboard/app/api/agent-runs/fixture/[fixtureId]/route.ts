import { NextRequest, NextResponse } from 'next/server';
import { createAgentDebugParser, AgentRun, AgentRunDebugResponse } from '@/lib/agent-debugger';

// Import fixtures
import normalRun from '@/lib/agent-debugger/fixtures/normal_run.json';
import loopRun from '@/lib/agent-debugger/fixtures/loop_run.json';
import highCostRun from '@/lib/agent-debugger/fixtures/high_cost_run.json';

const FIXTURES: Record<string, AgentRun> = {
  'normal': normalRun as unknown as AgentRun,
  'loop': loopRun as unknown as AgentRun,
  'high-cost': highCostRun as unknown as AgentRun,
  // Also support UUIDs from fixtures
  '550e8400-e29b-41d4-a716-446655440001': normalRun as unknown as AgentRun,
  '550e8400-e29b-41d4-a716-446655440002': loopRun as unknown as AgentRun,
  '550e8400-e29b-41d4-a716-446655440003': highCostRun as unknown as AgentRun,
};

/**
 * GET /api/agent-runs/fixture/[fixtureId]
 * 
 * Returns a debug view model for a fixture run.
 * This is for development/testing without database.
 * 
 * Available fixtures:
 * - normal: A normal successful run
 * - loop: A run with loop/retry issues
 * - high-cost: A run with high-cost operations
 * 
 * @feature AGENT_DEBUGGER_V1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fixtureId: string } }
) {
  try {
    // Check feature flag
    const agentDebuggerEnabled = process.env.AGENT_DEBUGGER_V1 === 'true';
    if (!agentDebuggerEnabled) {
      return NextResponse.json(
        { error: 'Agent Debugger feature is not enabled' },
        { status: 404 }
      );
    }

    const { fixtureId } = params;
    
    if (!fixtureId) {
      return NextResponse.json(
        { error: 'Fixture ID is required' },
        { status: 400 }
      );
    }

    const fixture = FIXTURES[fixtureId];
    if (!fixture) {
      return NextResponse.json(
        { 
          error: 'Fixture not found',
          available: Object.keys(FIXTURES).filter(k => !k.includes('-')),
        },
        { status: 404 }
      );
    }

    // Parse the fixture through the debug parser
    const parser = createAgentDebugParser({
      enabled: true,
      explainer_enabled: false, // Keep deterministic for fixtures
    });

    const debugViewModel = await parser.parse(fixture);

    const response: AgentRunDebugResponse = {
      debug: debugViewModel,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[AgentRunFixture] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent-runs/fixtures
 * 
 * List available fixtures
 */
export async function OPTIONS() {
  return NextResponse.json({
    fixtures: [
      { id: 'normal', description: 'A normal successful run with tool calls' },
      { id: 'loop', description: 'A run with retry loop issues' },
      { id: 'high-cost', description: 'A run with high-cost operations' },
    ],
  });
}
