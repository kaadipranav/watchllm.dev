-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 008_agent_debug_logs.sql
-- Description: Agent Debugger schema for storing agent run debug information
-- Feature Flag: AGENT_DEBUGGER_V1
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Agent Debug Logs Table
-- Stores structured debug information for agent runs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_debug_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Run metadata
    agent_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    
    -- Cost summary (pre-computed for fast queries)
    total_cost_usd DECIMAL(12, 8) DEFAULT 0,
    wasted_spend_usd DECIMAL(12, 8) DEFAULT 0,
    amount_saved_usd DECIMAL(12, 8) DEFAULT 0,
    cache_hit_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Step count for pagination info
    total_steps INTEGER NOT NULL DEFAULT 0,
    
    -- Flags summary (stored as JSON array of flag names for quick filtering)
    flags JSONB DEFAULT '[]'::jsonb,
    
    -- Run metadata (region, environment, custom tags)
    meta JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for agent_debug_logs
CREATE INDEX IF NOT EXISTS idx_agent_debug_logs_project_id ON agent_debug_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_debug_logs_user_id ON agent_debug_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_debug_logs_run_id ON agent_debug_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_debug_logs_started_at ON agent_debug_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_debug_logs_status ON agent_debug_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_debug_logs_agent_name ON agent_debug_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_debug_logs_flags ON agent_debug_logs USING GIN(flags);

-- Add comment
COMMENT ON TABLE agent_debug_logs IS 'Stores agent run debug information for the Agent Debugger feature';

-- ----------------------------------------------------------------------------
-- Agent Debug Steps Table
-- Stores individual steps within an agent run
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_debug_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES agent_debug_logs(run_id) ON DELETE CASCADE,
    
    -- Step identification
    step_index INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- Step type and content
    type TEXT NOT NULL CHECK (type IN ('user_input', 'decision', 'tool_call', 'tool_result', 'model_response', 'error', 'retry')),
    summary TEXT,
    
    -- Decision-specific fields
    decision TEXT,
    tool TEXT,
    tool_args JSONB,
    tool_output_summary TEXT,
    
    -- Raw payload (stored separately for large payloads)
    raw TEXT,
    raw_truncated BOOLEAN DEFAULT false,
    
    -- Cost attribution
    token_cost INTEGER DEFAULT 0,
    api_cost_usd DECIMAL(12, 8) DEFAULT 0,
    cache_hit BOOLEAN DEFAULT false,
    
    -- Explanation fields
    why_explanation TEXT,
    explain_confidence DECIMAL(3, 2),
    explain_source TEXT CHECK (explain_source IS NULL OR explain_source IN ('deterministic', 'llm')),
    explain_rules_matched JSONB DEFAULT '[]'::jsonb,
    
    -- Flags for this step
    flags JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint on run_id + step_index
    CONSTRAINT agent_debug_steps_unique_step UNIQUE (run_id, step_index)
);

-- Add indexes for agent_debug_steps
CREATE INDEX IF NOT EXISTS idx_agent_debug_steps_run_id ON agent_debug_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_debug_steps_type ON agent_debug_steps(type);
CREATE INDEX IF NOT EXISTS idx_agent_debug_steps_tool ON agent_debug_steps(tool) WHERE tool IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_debug_steps_flags ON agent_debug_steps USING GIN(flags);
CREATE INDEX IF NOT EXISTS idx_agent_debug_steps_run_step ON agent_debug_steps(run_id, step_index);

-- Add comment
COMMENT ON TABLE agent_debug_steps IS 'Individual steps within agent runs for debugging and analysis';

-- ----------------------------------------------------------------------------
-- Agent Debug Explanations Table
-- Stores LLM-generated explanations for auditability
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_debug_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES agent_debug_steps(id) ON DELETE CASCADE,
    
    -- LLM prompt and response
    llm_prompt TEXT NOT NULL,
    llm_response TEXT NOT NULL,
    llm_model TEXT,
    
    -- Provenance
    deterministic_facts JSONB DEFAULT '[]'::jsonb,
    confidence DECIMAL(3, 2) NOT NULL,
    
    -- Cost of explanation
    explanation_cost_usd DECIMAL(12, 8) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for agent_debug_explanations
CREATE INDEX IF NOT EXISTS idx_agent_debug_explanations_step_id ON agent_debug_explanations(step_id);

-- Add comment
COMMENT ON TABLE agent_debug_explanations IS 'Stores LLM-generated explanations for auditability and debugging';

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE agent_debug_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_debug_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_debug_explanations ENABLE ROW LEVEL SECURITY;

-- Policies for agent_debug_logs
CREATE POLICY "Users can view their own agent debug logs"
    ON agent_debug_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own agent debug logs"
    ON agent_debug_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own agent debug logs"
    ON agent_debug_logs FOR UPDATE
    USING (user_id = auth.uid());

-- Policies for agent_debug_steps (via run ownership)
CREATE POLICY "Users can view steps for their runs"
    ON agent_debug_steps FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM agent_debug_logs 
        WHERE agent_debug_logs.run_id = agent_debug_steps.run_id 
        AND agent_debug_logs.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert steps for their runs"
    ON agent_debug_steps FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM agent_debug_logs 
        WHERE agent_debug_logs.run_id = agent_debug_steps.run_id 
        AND agent_debug_logs.user_id = auth.uid()
    ));

-- Policies for agent_debug_explanations (via step/run ownership)
CREATE POLICY "Users can view explanations for their runs"
    ON agent_debug_explanations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM agent_debug_steps
        JOIN agent_debug_logs ON agent_debug_logs.run_id = agent_debug_steps.run_id
        WHERE agent_debug_steps.id = agent_debug_explanations.step_id
        AND agent_debug_logs.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert explanations for their runs"
    ON agent_debug_explanations FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM agent_debug_steps
        JOIN agent_debug_logs ON agent_debug_logs.run_id = agent_debug_steps.run_id
        WHERE agent_debug_steps.id = agent_debug_explanations.step_id
        AND agent_debug_logs.user_id = auth.uid()
    ));

-- ----------------------------------------------------------------------------
-- Updated_at trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_agent_debug_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_debug_logs_updated_at
    BEFORE UPDATE ON agent_debug_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_debug_logs_updated_at();
