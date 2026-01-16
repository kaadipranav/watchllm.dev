-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 009_agent_debug_service_role_policies.sql
-- Description: Add service role policies for agent debug tables
-- ============================================================================

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can insert their own agent debug logs" ON agent_debug_logs;
DROP POLICY IF EXISTS "Users can insert steps for their runs" ON agent_debug_steps;

-- Service role can insert any agent debug logs (for worker ingestion)
CREATE POLICY "Service role can insert agent debug logs"
    ON agent_debug_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Service role can insert any agent debug steps (for worker ingestion)
CREATE POLICY "Service role can insert agent debug steps"
    ON agent_debug_steps FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Re-add user policies for inserts (for direct user inserts, if needed)
CREATE POLICY "Users can insert their own agent debug logs"
    ON agent_debug_logs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert steps for their runs"
    ON agent_debug_steps FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM agent_debug_logs 
        WHERE agent_debug_logs.run_id = agent_debug_steps.run_id 
        AND agent_debug_logs.user_id = auth.uid()
    ));
