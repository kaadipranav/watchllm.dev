-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 012_request_coalescing.sql
-- Description: Track request coalescing/deduplication metrics
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Create coalescing stats table
-- Stores monthly aggregated coalescing metrics per project
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coalescing_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metrics
    coalesced_requests INTEGER NOT NULL DEFAULT 0,
    peak_concurrent INTEGER NOT NULL DEFAULT 0,
    total_requests_during_coalesce INTEGER NOT NULL DEFAULT 0,
    
    -- Estimated savings
    estimated_tokens_saved INTEGER NOT NULL DEFAULT 0,
    estimated_cost_saved_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one record per project per period
    CONSTRAINT coalescing_stats_unique UNIQUE (project_id, period_start, period_end)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_coalescing_stats_project 
    ON coalescing_stats(project_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_coalescing_stats_period 
    ON coalescing_stats(period_start, period_end);

COMMENT ON TABLE coalescing_stats IS 'Monthly request coalescing metrics per project';
COMMENT ON COLUMN coalescing_stats.coalesced_requests IS 'Number of requests served from in-flight deduplication';
COMMENT ON COLUMN coalescing_stats.peak_concurrent IS 'Maximum number of identical requests processed simultaneously';

-- ----------------------------------------------------------------------------
-- Step 2: Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE coalescing_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project coalescing stats"
    ON coalescing_stats FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage coalescing stats"
    ON coalescing_stats FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Step 3: Function to sync Redis coalescing stats to Supabase
-- Called periodically via cron or on-demand
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_coalescing_stats(
    p_project_id UUID,
    p_coalesced_requests INTEGER,
    p_peak_concurrent INTEGER,
    p_estimated_tokens_saved INTEGER DEFAULT 0,
    p_estimated_cost_saved_usd DECIMAL DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Calculate current month period
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Upsert the stats
    INSERT INTO coalescing_stats (
        project_id,
        period_start,
        period_end,
        coalesced_requests,
        peak_concurrent,
        estimated_tokens_saved,
        estimated_cost_saved_usd,
        updated_at
    ) VALUES (
        p_project_id,
        v_period_start,
        v_period_end,
        p_coalesced_requests,
        p_peak_concurrent,
        p_estimated_tokens_saved,
        p_estimated_cost_saved_usd,
        NOW()
    )
    ON CONFLICT (project_id, period_start, period_end)
    DO UPDATE SET
        coalesced_requests = GREATEST(coalescing_stats.coalesced_requests, EXCLUDED.coalesced_requests),
        peak_concurrent = GREATEST(coalescing_stats.peak_concurrent, EXCLUDED.peak_concurrent),
        estimated_tokens_saved = GREATEST(coalescing_stats.estimated_tokens_saved, EXCLUDED.estimated_tokens_saved),
        estimated_cost_saved_usd = GREATEST(coalescing_stats.estimated_cost_saved_usd, EXCLUDED.estimated_cost_saved_usd),
        updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION sync_coalescing_stats IS 'Sync coalescing stats from Redis to Supabase';

-- ----------------------------------------------------------------------------
-- Step 4: View for coalescing analytics
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW coalescing_analytics AS
SELECT 
    cs.project_id,
    p.name as project_name,
    cs.period_start,
    cs.period_end,
    cs.coalesced_requests,
    cs.peak_concurrent,
    cs.estimated_tokens_saved,
    cs.estimated_cost_saved_usd,
    -- Calculate percentage of requests that were coalesced
    CASE 
        WHEN cs.total_requests_during_coalesce > 0 
        THEN ROUND((cs.coalesced_requests::DECIMAL / cs.total_requests_during_coalesce) * 100, 2)
        ELSE 0 
    END as coalesce_rate_percent,
    cs.updated_at
FROM coalescing_stats cs
JOIN projects p ON cs.project_id = p.id
ORDER BY cs.period_start DESC;

COMMENT ON VIEW coalescing_analytics IS 'Coalescing stats with project info for dashboard';

-- ----------------------------------------------------------------------------
-- Step 5: Add coalescing metrics to usage_logs for granular tracking
-- ----------------------------------------------------------------------------
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS coalesced BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN usage_logs.coalesced IS 'Whether this request was served via request coalescing';
