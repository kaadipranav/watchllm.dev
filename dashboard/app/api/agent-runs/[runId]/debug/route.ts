import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  createAgentDebugParser,
  AgentRunDebugResponse,
  AgentRun,
  AgentStep,
} from '@/lib/agent-debugger';

/**
 * GET /api/agent-runs/[runId]/debug
 * 
 * Returns the full debug view model for a specific agent run.
 * 
 * @feature AGENT_DEBUGGER_V1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
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

    const { runId } = params;
    
    if (!runId) {
      return NextResponse.json(
        { error: 'Run ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the run log
    const { data: runLog, error: runError } = await supabase
      .from('agent_debug_logs')
      .select('*')
      .eq('run_id', runId)
      .eq('user_id', user.id)
      .single();

    if (runError) {
      // Check if table doesn't exist (migration not run)
      if (runError.message?.includes('relation') && runError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Agent debug tables not found. Please run the database migration first.' },
          { status: 404 }
        );
      }
      
      // Not found or other error
      if (runError.code === 'PGRST116' || !runLog) {
        return NextResponse.json(
          { error: 'Agent run not found' },
          { status: 404 }
        );
      }
      
      // Other error
      console.error('[AgentRunDebug] Run query error:', runError);
      return NextResponse.json(
        { error: 'Failed to fetch agent run' },
        { status: 500 }
      );
    }

    // Fetch the steps
    const { data: steps, error: stepsError } = await supabase
      .from('agent_debug_steps')
      .select('*')
      .eq('run_id', runId)
      .order('step_index', { ascending: true });

    if (stepsError) {
      console.error('[AgentRunDebug] Steps query error:', stepsError);
      
      // Check if table doesn't exist (shouldn't happen if logs table exists, but handle it)
      if (stepsError.message?.includes('relation') && stepsError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Agent debug tables not found. Please run the database migration first.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch run steps' },
        { status: 500 }
      );
    }

    // Extract caching opportunities from meta if available
    const meta = typeof runLog.meta === 'string' ? JSON.parse(runLog.meta) : (runLog.meta || {});
    const cachingOpportunities = meta.caching_opportunities || [];
    
    // Convert DB records to AgentRun format
    const agentRun: AgentRun = {
      run_id: runLog.run_id,
      started_at: runLog.started_at,
      ended_at: runLog.ended_at,
      user_id: runLog.user_id,
      project_id: runLog.project_id,
      agent_name: runLog.agent_name,
      status: runLog.status,
      total_cost_usd: runLog.total_cost_usd,
      meta: {
        ...meta,
        caching_opportunities: cachingOpportunities, // Preserve for parser
      },
      steps: (steps || []).map((step: any): AgentStep => ({
        step_index: step.step_index,
        timestamp: step.timestamp,
        type: step.type,
        summary: step.summary,
        raw: step.raw,
        decision: step.decision,
        tool: step.tool,
        tool_args: step.tool_args,
        tool_output_summary: step.tool_output_summary,
        token_cost: step.token_cost,
        api_cost_usd: step.api_cost_usd,
        cache_hit: step.cache_hit,
        why_explanation: step.why_explanation,
        explain_confidence: step.explain_confidence,
        explain_source: step.explain_source,
        explain_rules_matched: step.explain_rules_matched,
        flags: step.flags,
      })),
    };

    // Parse the run through the debug parser
    const parser = createAgentDebugParser({
      enabled: true,
      explainer_enabled: process.env.EXPLAINER_ENABLED === 'true',
    });

    const debugViewModel = await parser.parse(agentRun);

    const response: AgentRunDebugResponse = {
      debug: debugViewModel,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[AgentRunDebug] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
