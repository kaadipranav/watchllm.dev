import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AgentRunsListResponse, AgentRunListItem } from '@/lib/agent-debugger';

/**
 * GET /api/agent-runs
 * 
 * Returns a paginated list of agent runs for the authenticated user.
 * 
 * Query parameters:
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 * - project_id: string (optional, filter by project)
 * - status: string (optional, filter by status)
 * - agent_name: string (optional, filter by agent name)
 * 
 * @feature AGENT_DEBUGGER_V1
 */
export async function GET(request: NextRequest) {
  try {
    // Check feature flag
    const agentDebuggerEnabled = process.env.AGENT_DEBUGGER_V1 === 'true';
    if (!agentDebuggerEnabled) {
      return NextResponse.json(
        { error: 'Agent Debugger feature is not enabled' },
        { status: 404 }
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const agentName = searchParams.get('agent_name');

    // Build query
    let query = supabase
      .from('agent_debug_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (agentName) {
      query = query.ilike('agent_name', `%${agentName}%`);
    }

    const { data: runs, error: queryError, count } = await query;

    if (queryError) {
      console.error('[AgentRuns] Query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch agent runs' },
        { status: 500 }
      );
    }

    // Transform to list response format
    const runsList: AgentRunListItem[] = (runs || []).map(run => ({
      run_id: run.run_id,
      agent_name: run.agent_name,
      started_at: run.started_at,
      ended_at: run.ended_at,
      status: run.status,
      total_cost_usd: run.total_cost_usd,
      total_steps: run.total_steps,
      flags_count: Array.isArray(run.flags) ? run.flags.length : 0,
      has_warnings: Array.isArray(run.flags) && run.flags.some(
        (f: any) => f.severity === 'warning' || f.severity === 'error'
      ),
    }));

    const response: AgentRunsListResponse = {
      runs: runsList,
      total: count || 0,
      has_more: (count || 0) > offset + limit,
      limit,
      offset,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[AgentRuns] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
