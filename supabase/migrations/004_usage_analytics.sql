-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 004_usage_analytics.sql
-- Description: Add usage analytics features - cost savings tracking and aggregations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Add potential_cost_usd column to track cache savings
-- ----------------------------------------------------------------------------
ALTER TABLE usage_logs 
ADD COLUMN IF NOT EXISTS potential_cost_usd DECIMAL(10, 6) DEFAULT 0 CHECK (potential_cost_usd >= 0);

COMMENT ON COLUMN usage_logs.potential_cost_usd IS 'What the request would have cost without caching (for calculating savings)';

-- Update existing cached rows to have potential_cost_usd = cost_usd
-- (For historical data, we assume cached requests would have cost the same)
UPDATE usage_logs 
SET potential_cost_usd = cost_usd 
WHERE cached = true AND potential_cost_usd = 0;

-- ----------------------------------------------------------------------------
-- Step 2: Create hourly aggregations table for fast dashboard queries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_aggregations_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    hour_start TIMESTAMPTZ NOT NULL,
    
    -- Request counts
    total_requests INTEGER NOT NULL DEFAULT 0,
    cached_requests INTEGER NOT NULL DEFAULT 0,
    cache_hit_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage
    
    -- Token usage
    total_tokens_input BIGINT NOT NULL DEFAULT 0,
    total_tokens_output BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    
    -- Cost tracking
    total_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    total_potential_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    total_savings_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    
    -- Performance
    avg_latency_ms INTEGER DEFAULT 0,
    
    -- Provider breakdown (JSONB for flexibility)
    requests_by_provider JSONB DEFAULT '{}'::jsonb,
    requests_by_model JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one row per project per hour
    CONSTRAINT usage_aggregations_hourly_unique UNIQUE (project_id, hour_start)
);

-- Add indexes for hourly aggregations
CREATE INDEX IF NOT EXISTS idx_usage_agg_hourly_project_hour 
    ON usage_aggregations_hourly(project_id, hour_start DESC);
CREATE INDEX IF NOT EXISTS idx_usage_agg_hourly_hour 
    ON usage_aggregations_hourly(hour_start DESC);

COMMENT ON TABLE usage_aggregations_hourly IS 'Pre-calculated hourly usage statistics for fast dashboard loading';

-- ----------------------------------------------------------------------------
-- Step 3: Create daily aggregations table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_aggregations_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Request counts
    total_requests INTEGER NOT NULL DEFAULT 0,
    cached_requests INTEGER NOT NULL DEFAULT 0,
    cache_hit_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Token usage
    total_tokens_input BIGINT NOT NULL DEFAULT 0,
    total_tokens_output BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    
    -- Cost tracking
    total_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    total_potential_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    total_savings_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    
    -- Performance
    avg_latency_ms INTEGER DEFAULT 0,
    
    -- Provider breakdown
    requests_by_provider JSONB DEFAULT '{}'::jsonb,
    requests_by_model JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT usage_aggregations_daily_unique UNIQUE (project_id, date)
);

-- Add indexes for daily aggregations
CREATE INDEX IF NOT EXISTS idx_usage_agg_daily_project_date 
    ON usage_aggregations_daily(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_agg_daily_date 
    ON usage_aggregations_daily(date DESC);

COMMENT ON TABLE usage_aggregations_daily IS 'Pre-calculated daily usage statistics for fast dashboard loading';

-- ----------------------------------------------------------------------------
-- Step 4: Function to aggregate hourly stats
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION aggregate_usage_hourly(
    p_project_id UUID,
    p_hour_start TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
    v_hour_end TIMESTAMPTZ;
    v_total_requests INTEGER;
    v_cached_requests INTEGER;
    v_cache_hit_rate DECIMAL(5, 2);
    v_total_tokens_input BIGINT;
    v_total_tokens_output BIGINT;
    v_total_tokens BIGINT;
    v_total_cost DECIMAL(10, 6);
    v_total_potential_cost DECIMAL(10, 6);
    v_total_savings DECIMAL(10, 6);
    v_avg_latency INTEGER;
    v_requests_by_provider JSONB;
    v_requests_by_model JSONB;
BEGIN
    v_hour_end := p_hour_start + INTERVAL '1 hour';
    
    -- Calculate aggregates
    SELECT 
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE cached = true)::INTEGER,
        COALESCE(SUM(tokens_input), 0)::BIGINT,
        COALESCE(SUM(tokens_output), 0)::BIGINT,
        COALESCE(SUM(tokens_total), 0)::BIGINT,
        COALESCE(SUM(cost_usd), 0)::DECIMAL(10, 6),
        COALESCE(SUM(potential_cost_usd), 0)::DECIMAL(10, 6),
        ROUND(AVG(latency_ms))::INTEGER
    INTO 
        v_total_requests,
        v_cached_requests,
        v_total_tokens_input,
        v_total_tokens_output,
        v_total_tokens,
        v_total_cost,
        v_total_potential_cost,
        v_avg_latency
    FROM usage_logs
    WHERE project_id = p_project_id
        AND created_at >= p_hour_start
        AND created_at < v_hour_end;
    
    -- Calculate cache hit rate
    v_cache_hit_rate := CASE 
        WHEN v_total_requests > 0 THEN 
            ROUND((v_cached_requests::DECIMAL / v_total_requests::DECIMAL) * 100, 2)
        ELSE 0 
    END;
    
    -- Calculate savings
    v_total_savings := v_total_potential_cost - v_total_cost;
    
    -- Get provider breakdown
    SELECT COALESCE(jsonb_object_agg(provider, count), '{}'::jsonb)
    INTO v_requests_by_provider
    FROM (
        SELECT provider, COUNT(*)::INTEGER as count
        FROM usage_logs
        WHERE project_id = p_project_id
            AND created_at >= p_hour_start
            AND created_at < v_hour_end
        GROUP BY provider
    ) provider_counts;
    
    -- Get model breakdown
    SELECT COALESCE(jsonb_object_agg(model, count), '{}'::jsonb)
    INTO v_requests_by_model
    FROM (
        SELECT model, COUNT(*)::INTEGER as count
        FROM usage_logs
        WHERE project_id = p_project_id
            AND created_at >= p_hour_start
            AND created_at < v_hour_end
        GROUP BY model
    ) model_counts;
    
    -- Insert or update aggregation
    INSERT INTO usage_aggregations_hourly (
        project_id,
        hour_start,
        total_requests,
        cached_requests,
        cache_hit_rate,
        total_tokens_input,
        total_tokens_output,
        total_tokens,
        total_cost_usd,
        total_potential_cost_usd,
        total_savings_usd,
        avg_latency_ms,
        requests_by_provider,
        requests_by_model
    ) VALUES (
        p_project_id,
        p_hour_start,
        v_total_requests,
        v_cached_requests,
        v_cache_hit_rate,
        v_total_tokens_input,
        v_total_tokens_output,
        v_total_tokens,
        v_total_cost,
        v_total_potential_cost,
        v_total_savings,
        v_avg_latency,
        v_requests_by_provider,
        v_requests_by_model
    )
    ON CONFLICT (project_id, hour_start)
    DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        cached_requests = EXCLUDED.cached_requests,
        cache_hit_rate = EXCLUDED.cache_hit_rate,
        total_tokens_input = EXCLUDED.total_tokens_input,
        total_tokens_output = EXCLUDED.total_tokens_output,
        total_tokens = EXCLUDED.total_tokens,
        total_cost_usd = EXCLUDED.total_cost_usd,
        total_potential_cost_usd = EXCLUDED.total_potential_cost_usd,
        total_savings_usd = EXCLUDED.total_savings_usd,
        avg_latency_ms = EXCLUDED.avg_latency_ms,
        requests_by_provider = EXCLUDED.requests_by_provider,
        requests_by_model = EXCLUDED.requests_by_model,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION aggregate_usage_hourly IS 'Aggregate usage logs into hourly statistics';

-- ----------------------------------------------------------------------------
-- Step 5: Function to aggregate daily stats
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION aggregate_usage_daily(
    p_project_id UUID,
    p_date DATE
)
RETURNS void AS $$
DECLARE
    v_date_start TIMESTAMPTZ;
    v_date_end TIMESTAMPTZ;
    v_total_requests INTEGER;
    v_cached_requests INTEGER;
    v_cache_hit_rate DECIMAL(5, 2);
    v_total_tokens_input BIGINT;
    v_total_tokens_output BIGINT;
    v_total_tokens BIGINT;
    v_total_cost DECIMAL(10, 6);
    v_total_potential_cost DECIMAL(10, 6);
    v_total_savings DECIMAL(10, 6);
    v_avg_latency INTEGER;
    v_requests_by_provider JSONB;
    v_requests_by_model JSONB;
BEGIN
    v_date_start := p_date::TIMESTAMPTZ;
    v_date_end := (p_date + INTERVAL '1 day')::TIMESTAMPTZ;
    
    -- Calculate aggregates
    SELECT 
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE cached = true)::INTEGER,
        COALESCE(SUM(tokens_input), 0)::BIGINT,
        COALESCE(SUM(tokens_output), 0)::BIGINT,
        COALESCE(SUM(tokens_total), 0)::BIGINT,
        COALESCE(SUM(cost_usd), 0)::DECIMAL(10, 6),
        COALESCE(SUM(potential_cost_usd), 0)::DECIMAL(10, 6),
        ROUND(AVG(latency_ms))::INTEGER
    INTO 
        v_total_requests,
        v_cached_requests,
        v_total_tokens_input,
        v_total_tokens_output,
        v_total_tokens,
        v_total_cost,
        v_total_potential_cost,
        v_avg_latency
    FROM usage_logs
    WHERE project_id = p_project_id
        AND created_at >= v_date_start
        AND created_at < v_date_end;
    
    -- Calculate cache hit rate
    v_cache_hit_rate := CASE 
        WHEN v_total_requests > 0 THEN 
            ROUND((v_cached_requests::DECIMAL / v_total_requests::DECIMAL) * 100, 2)
        ELSE 0 
    END;
    
    -- Calculate savings
    v_total_savings := v_total_potential_cost - v_total_cost;
    
    -- Get provider breakdown
    SELECT COALESCE(jsonb_object_agg(provider, count), '{}'::jsonb)
    INTO v_requests_by_provider
    FROM (
        SELECT provider, COUNT(*)::INTEGER as count
        FROM usage_logs
        WHERE project_id = p_project_id
            AND created_at >= v_date_start
            AND created_at < v_date_end
        GROUP BY provider
    ) provider_counts;
    
    -- Get model breakdown
    SELECT COALESCE(jsonb_object_agg(model, count), '{}'::jsonb)
    INTO v_requests_by_model
    FROM (
        SELECT model, COUNT(*)::INTEGER as count
        FROM usage_logs
        WHERE project_id = p_project_id
            AND created_at >= v_date_start
            AND created_at < v_date_end
        GROUP BY model
    ) model_counts;
    
    -- Insert or update aggregation
    INSERT INTO usage_aggregations_daily (
        project_id,
        date,
        total_requests,
        cached_requests,
        cache_hit_rate,
        total_tokens_input,
        total_tokens_output,
        total_tokens,
        total_cost_usd,
        total_potential_cost_usd,
        total_savings_usd,
        avg_latency_ms,
        requests_by_provider,
        requests_by_model
    ) VALUES (
        p_project_id,
        p_date,
        v_total_requests,
        v_cached_requests,
        v_cache_hit_rate,
        v_total_tokens_input,
        v_total_tokens_output,
        v_total_tokens,
        v_total_cost,
        v_total_potential_cost,
        v_total_savings,
        v_avg_latency,
        v_requests_by_provider,
        v_requests_by_model
    )
    ON CONFLICT (project_id, date)
    DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        cached_requests = EXCLUDED.cached_requests,
        cache_hit_rate = EXCLUDED.cache_hit_rate,
        total_tokens_input = EXCLUDED.total_tokens_input,
        total_tokens_output = EXCLUDED.total_tokens_output,
        total_tokens = EXCLUDED.total_tokens,
        total_cost_usd = EXCLUDED.total_cost_usd,
        total_potential_cost_usd = EXCLUDED.total_potential_cost_usd,
        total_savings_usd = EXCLUDED.total_savings_usd,
        avg_latency_ms = EXCLUDED.avg_latency_ms,
        requests_by_provider = EXCLUDED.requests_by_provider,
        requests_by_model = EXCLUDED.requests_by_model,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION aggregate_usage_daily IS 'Aggregate usage logs into daily statistics';

-- ----------------------------------------------------------------------------
-- Step 6: Function to get dashboard stats (fast query)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_project_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date DATE,
    total_requests INTEGER,
    cached_requests INTEGER,
    cache_hit_rate DECIMAL(5, 2),
    total_cost_usd DECIMAL(10, 6),
    total_savings_usd DECIMAL(10, 6),
    avg_latency_ms INTEGER,
    requests_by_provider JSONB,
    requests_by_model JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.date,
        d.total_requests,
        d.cached_requests,
        d.cache_hit_rate,
        d.total_cost_usd,
        d.total_savings_usd,
        d.avg_latency_ms,
        d.requests_by_provider,
        d.requests_by_model
    FROM usage_aggregations_daily d
    WHERE d.project_id = p_project_id
        AND d.date >= CURRENT_DATE - p_days
    ORDER BY d.date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_dashboard_stats IS 'Get pre-aggregated dashboard statistics for fast loading';

-- ----------------------------------------------------------------------------
-- Step 7: Trigger to update aggregations on new usage logs
-- (Optional - can also use scheduled jobs)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_update_aggregations()
RETURNS TRIGGER AS $$
BEGIN
    -- Update hourly aggregation for the hour this log belongs to
    PERFORM aggregate_usage_hourly(
        NEW.project_id,
        DATE_TRUNC('hour', NEW.created_at)
    );
    
    -- Update daily aggregation for the day this log belongs to
    PERFORM aggregate_usage_daily(
        NEW.project_id,
        DATE(NEW.created_at)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (disabled by default - enable if you want real-time aggregation)
-- Note: This can slow down inserts, so consider using scheduled jobs instead
-- CREATE TRIGGER update_aggregations_on_insert
--     AFTER INSERT ON usage_logs
--     FOR EACH ROW
--     EXECUTE FUNCTION trigger_update_aggregations();

-- ----------------------------------------------------------------------------
-- Step 8: Add triggers for updated_at
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_usage_agg_hourly_updated_at
    BEFORE UPDATE ON usage_aggregations_hourly
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_agg_daily_updated_at
    BEFORE UPDATE ON usage_aggregations_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Step 9: Grant permissions
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION aggregate_usage_hourly TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_usage_daily TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;

-- ----------------------------------------------------------------------------
-- Step 10: Enable RLS on aggregation tables
-- ----------------------------------------------------------------------------
ALTER TABLE usage_aggregations_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_aggregations_daily ENABLE ROW LEVEL SECURITY;

-- Users can view aggregations for their projects
CREATE POLICY "Users can view own hourly aggregations"
    ON usage_aggregations_hourly FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own daily aggregations"
    ON usage_aggregations_daily FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Service role can manage all aggregations
CREATE POLICY "Service role can manage hourly aggregations"
    ON usage_aggregations_hourly FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage daily aggregations"
    ON usage_aggregations_daily FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
DECLARE
    tables_exist BOOLEAN;
BEGIN
    SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usage_aggregations_hourly')
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usage_aggregations_daily')
    INTO tables_exist;
    
    IF tables_exist THEN
        RAISE NOTICE 'Migration 004 successful: Usage analytics tables and functions created';
    ELSE
        RAISE WARNING 'Migration 004 incomplete: Some tables were not created';
    END IF;
END $$;
