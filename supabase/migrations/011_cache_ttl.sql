-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 011_cache_ttl.sql
-- Description: Add cache TTL (Time-To-Live) configuration to projects
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Add TTL configuration columns to projects table
-- ----------------------------------------------------------------------------

-- Default TTL in seconds (24 hours = 86400 seconds)
-- NULL means never expire
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS cache_ttl_seconds INTEGER DEFAULT 86400
    CHECK (cache_ttl_seconds IS NULL OR cache_ttl_seconds > 0);

-- Per-endpoint TTL overrides as JSONB
-- Format: { "/v1/chat/completions": 3600, "/v1/embeddings": null }
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS cache_ttl_overrides JSONB DEFAULT NULL;

COMMENT ON COLUMN projects.cache_ttl_seconds IS 'Default cache TTL in seconds. NULL = never expire. Default: 86400 (24 hours)';
COMMENT ON COLUMN projects.cache_ttl_overrides IS 'Per-endpoint TTL overrides as JSON object. Keys are endpoint paths, values are TTL in seconds (null = never expire)';

-- ----------------------------------------------------------------------------
-- Step 2: Create cache invalidation log table
-- Tracks manual and automatic cache invalidations for analytics
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cache_invalidations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Invalidation details
    invalidation_type TEXT NOT NULL CHECK (invalidation_type IN ('manual', 'ttl_expiry', 'api', 'webhook')),
    entries_invalidated INTEGER NOT NULL DEFAULT 0,
    
    -- Filter criteria used (for manual/API invalidations)
    filters JSONB DEFAULT NULL,
    -- Example: { "model": "gpt-4", "date_before": "2024-01-01", "similarity_below": 0.90 }
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Optional notes
    notes TEXT
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_cache_invalidations_project 
    ON cache_invalidations(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cache_invalidations_type 
    ON cache_invalidations(project_id, invalidation_type);

COMMENT ON TABLE cache_invalidations IS 'Log of cache invalidation events for analytics and auditing';

-- ----------------------------------------------------------------------------
-- Step 3: Row Level Security for cache_invalidations
-- ----------------------------------------------------------------------------
ALTER TABLE cache_invalidations ENABLE ROW LEVEL SECURITY;

-- Users can view invalidation logs for their projects
CREATE POLICY "Users can view own project cache invalidations"
    ON cache_invalidations FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can insert invalidation logs for their projects
CREATE POLICY "Users can insert cache invalidations"
    ON cache_invalidations FOR INSERT
    TO authenticated
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Step 4: Create cache age analytics view
-- Shows distribution of cache entry ages
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW cache_age_analytics AS
WITH ttl_config AS (
    SELECT 
        id as project_id,
        COALESCE(cache_ttl_seconds, 0) as ttl_seconds
    FROM projects
)
SELECT 
    project_id,
    -- Age buckets
    COUNT(*) FILTER (WHERE age_hours < 1) as entries_under_1h,
    COUNT(*) FILTER (WHERE age_hours >= 1 AND age_hours < 6) as entries_1h_to_6h,
    COUNT(*) FILTER (WHERE age_hours >= 6 AND age_hours < 24) as entries_6h_to_24h,
    COUNT(*) FILTER (WHERE age_hours >= 24 AND age_hours < 168) as entries_1d_to_7d,
    COUNT(*) FILTER (WHERE age_hours >= 168 AND age_hours < 720) as entries_7d_to_30d,
    COUNT(*) FILTER (WHERE age_hours >= 720) as entries_over_30d,
    COUNT(*) as total_entries,
    AVG(age_hours) as avg_age_hours,
    MAX(age_hours) as max_age_hours
FROM (
    SELECT 
        project_id,
        EXTRACT(EPOCH FROM (NOW() - to_timestamp(timestamp/1000))) / 3600 as age_hours
    FROM semantic_cache_stats
) as cache_ages
GROUP BY project_id;

COMMENT ON VIEW cache_age_analytics IS 'Cache entry age distribution analytics per project';

-- ----------------------------------------------------------------------------
-- Step 5: Create semantic_cache_stats table for analytics
-- (This duplicates some info from D1 for Supabase-side analytics)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS semantic_cache_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Cache entry metadata (synced from D1 periodically or on important events)
    cache_entry_id TEXT NOT NULL, -- ID from D1
    kind TEXT NOT NULL, -- 'chat' or 'completion'
    model TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timestamp BIGINT NOT NULL, -- Original cache entry timestamp
    
    -- Hit tracking
    hit_count INTEGER NOT NULL DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    
    -- TTL tracking
    expires_at TIMESTAMPTZ, -- NULL = never expires
    is_expired BOOLEAN GENERATED ALWAYS AS (expires_at IS NOT NULL AND expires_at < NOW()) STORED,
    
    -- Tokens saved
    tokens_saved INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT semantic_cache_stats_unique UNIQUE (project_id, cache_entry_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_cache_stats_project 
    ON semantic_cache_stats(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cache_stats_expired 
    ON semantic_cache_stats(project_id, is_expired) WHERE is_expired = false;
CREATE INDEX IF NOT EXISTS idx_cache_stats_expires_at 
    ON semantic_cache_stats(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE semantic_cache_stats IS 'Cache entry statistics for analytics and TTL management';

-- ----------------------------------------------------------------------------
-- Step 6: Row Level Security for semantic_cache_stats
-- ----------------------------------------------------------------------------
ALTER TABLE semantic_cache_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project cache stats"
    ON semantic_cache_stats FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage cache stats"
    ON semantic_cache_stats FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Step 7: Function to get TTL recommendations
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_cache_ttl_recommendation(p_project_id UUID)
RETURNS TABLE (
    current_ttl_seconds INTEGER,
    recommended_ttl_seconds INTEGER,
    reason TEXT,
    stale_hit_percentage DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_ttl INTEGER;
    v_total_hits INTEGER;
    v_stale_hits INTEGER;
    v_stale_percentage DECIMAL;
BEGIN
    -- Get current TTL
    SELECT cache_ttl_seconds INTO v_current_ttl
    FROM projects WHERE id = p_project_id;
    
    v_current_ttl := COALESCE(v_current_ttl, 86400);
    
    -- Count hits on old entries (>7 days old)
    SELECT 
        COUNT(*) FILTER (WHERE hit_count > 0),
        COUNT(*) FILTER (WHERE hit_count > 0 AND created_at < NOW() - INTERVAL '7 days')
    INTO v_total_hits, v_stale_hits
    FROM semantic_cache_stats
    WHERE project_id = p_project_id
    AND created_at > NOW() - INTERVAL '30 days';
    
    IF v_total_hits IS NULL OR v_total_hits < 10 THEN
        RETURN QUERY SELECT 
            v_current_ttl,
            NULL::INTEGER,
            'Not enough cache hit data to make a recommendation'::TEXT,
            0::DECIMAL;
        RETURN;
    END IF;
    
    v_stale_percentage := (v_stale_hits::DECIMAL / v_total_hits) * 100;
    
    -- High percentage of stale hits - recommend shorter TTL
    IF v_stale_percentage > 30 THEN
        RETURN QUERY SELECT 
            v_current_ttl,
            CASE 
                WHEN v_current_ttl > 604800 THEN 604800  -- 7 days
                WHEN v_current_ttl > 86400 THEN 86400    -- 1 day
                ELSE 21600                                -- 6 hours
            END,
            format('%.0f%% of cache hits are on entries >7 days old. Consider a shorter TTL.', v_stale_percentage),
            v_stale_percentage;
        RETURN;
    END IF;
    
    -- Low percentage of stale hits and short TTL - could increase
    IF v_stale_percentage < 5 AND v_current_ttl < 86400 THEN
        RETURN QUERY SELECT 
            v_current_ttl,
            86400, -- 24 hours
            format('Only %.0f%% of hits are stale. You could increase TTL to save more.', v_stale_percentage),
            v_stale_percentage;
        RETURN;
    END IF;
    
    -- Current TTL is appropriate
    RETURN QUERY SELECT 
        v_current_ttl,
        NULL::INTEGER,
        format('Current TTL is well-tuned. Stale hit rate: %.0f%%', v_stale_percentage),
        v_stale_percentage;
END;
$$;

COMMENT ON FUNCTION get_cache_ttl_recommendation IS 'Returns TTL recommendation based on cache hit patterns';
