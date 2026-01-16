-- Run this in Supabase SQL Editor to fix RLS policies
-- https://supabase.com/dashboard/project/pcpioqczebgdhktpgxxi/sql/new

-- Drop existing restrictive policies
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
