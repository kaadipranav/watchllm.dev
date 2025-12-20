-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 005_project_configuration.sql
-- Description: Add project-level configuration for semantic cache thresholds and A/B testing
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Add configuration columns to projects table
-- ----------------------------------------------------------------------------
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS semantic_cache_threshold DECIMAL(3, 2) DEFAULT 0.85 
    CHECK (semantic_cache_threshold >= 0.50 AND semantic_cache_threshold <= 0.99);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS ab_testing_enabled BOOLEAN DEFAULT false;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS ab_testing_config JSONB DEFAULT NULL;

COMMENT ON COLUMN projects.semantic_cache_threshold IS 'Similarity threshold for semantic caching (0.50-0.99). Higher = stricter matching.';
COMMENT ON COLUMN projects.ab_testing_enabled IS 'Whether A/B testing is enabled for this project';
COMMENT ON COLUMN projects.ab_testing_config IS 'A/B testing configuration: { "variants": [{"model": "gpt-4", "weight": 50}, ...] }';

-- ----------------------------------------------------------------------------
-- Step 2: Create A/B testing results table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    model TEXT NOT NULL,
    
    -- Performance metrics
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    
    -- Cost metrics
    total_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    avg_cost_per_request DECIMAL(10, 6) NOT NULL DEFAULT 0,
    
    -- Performance metrics
    avg_latency_ms INTEGER NOT NULL DEFAULT 0,
    p50_latency_ms INTEGER DEFAULT NULL,
    p95_latency_ms INTEGER DEFAULT NULL,
    p99_latency_ms INTEGER DEFAULT NULL,
    
    -- Token metrics
    avg_tokens_input INTEGER NOT NULL DEFAULT 0,
    avg_tokens_output INTEGER NOT NULL DEFAULT 0,
    
    -- Cache metrics
    cache_hit_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT ab_test_results_unique UNIQUE (project_id, variant_name, period_start)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ab_test_results_project 
    ON ab_test_results(project_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant 
    ON ab_test_results(project_id, variant_name);

COMMENT ON TABLE ab_test_results IS 'Aggregated A/B testing results for model comparison';

-- ----------------------------------------------------------------------------
-- Step 3: Create cost forecasting table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cost_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Forecast data
    forecast_date DATE NOT NULL,
    predicted_cost_usd DECIMAL(10, 6) NOT NULL,
    confidence_interval_low DECIMAL(10, 6) NOT NULL,
    confidence_interval_high DECIMAL(10, 6) NOT NULL,
    
    -- Historical data used
    days_of_data INTEGER NOT NULL,
    avg_daily_cost DECIMAL(10, 6) NOT NULL,
    trend_direction TEXT CHECK (trend_direction IN ('increasing', 'decreasing', 'stable')),
    trend_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Metadata
    model_type TEXT DEFAULT 'linear_regression',
    accuracy_score DECIMAL(5, 4) DEFAULT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT cost_forecasts_unique UNIQUE (project_id, forecast_date)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_cost_forecasts_project_date 
    ON cost_forecasts(project_id, forecast_date DESC);

COMMENT ON TABLE cost_forecasts IS 'Cost predictions based on historical usage patterns';

-- ----------------------------------------------------------------------------
-- Step 4: Function to calculate cost forecast
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_cost_forecast(
    p_project_id UUID,
    p_forecast_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    forecast_date DATE,
    predicted_cost DECIMAL(10, 6),
    confidence_low DECIMAL(10, 6),
    confidence_high DECIMAL(10, 6),
    trend TEXT
) AS $$
DECLARE
    v_avg_daily_cost DECIMAL(10, 6);
    v_daily_growth DECIMAL(10, 6);
    v_std_dev DECIMAL(10, 6);
    v_days_of_data INTEGER;
    v_current_date DATE;
    v_trend TEXT;
BEGIN
    -- Calculate average daily cost from last 30 days
    SELECT 
        AVG(daily_cost),
        STDDEV(daily_cost),
        COUNT(*)
    INTO 
        v_avg_daily_cost,
        v_std_dev,
        v_days_of_data
    FROM (
        SELECT 
            DATE(created_at) as date,
            SUM(cost_usd) as daily_cost
        FROM usage_logs
        WHERE project_id = p_project_id
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
    ) daily_costs;
    
    -- If no data, return empty
    IF v_days_of_data = 0 THEN
        RETURN;
    END IF;
    
    -- Calculate growth trend (simple linear regression slope)
    SELECT 
        COALESCE(
            REGR_SLOPE(daily_cost, day_number),
            0
        )
    INTO v_daily_growth
    FROM (
        SELECT 
            ROW_NUMBER() OVER (ORDER BY date) as day_number,
            SUM(cost_usd) as daily_cost
        FROM usage_logs
        WHERE project_id = p_project_id
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at), created_at::DATE
    ) trend_data;
    
    -- Determine trend direction
    IF v_daily_growth > 0.01 THEN
        v_trend := 'increasing';
    ELSIF v_daily_growth < -0.01 THEN
        v_trend := 'decreasing';
    ELSE
        v_trend := 'stable';
    END IF;
    
    -- Generate forecasts for next N days
    v_current_date := CURRENT_DATE;
    
    FOR i IN 1..p_forecast_days LOOP
        v_current_date := CURRENT_DATE + i;
        
        -- Simple forecast: avg + (growth * days_ahead)
        -- With confidence interval based on std dev
        RETURN QUERY SELECT
            v_current_date,
            GREATEST(0, v_avg_daily_cost + (v_daily_growth * i))::DECIMAL(10, 6),
            GREATEST(0, v_avg_daily_cost + (v_daily_growth * i) - (v_std_dev * 1.96))::DECIMAL(10, 6),
            (v_avg_daily_cost + (v_daily_growth * i) + (v_std_dev * 1.96))::DECIMAL(10, 6),
            v_trend;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_cost_forecast IS 'Generate cost forecasts using linear regression on historical data';

-- ----------------------------------------------------------------------------
-- Step 5: Function to update A/B test results
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_ab_test_results(
    p_project_id UUID,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
    v_variant RECORD;
    v_config JSONB;
BEGIN
    -- Get A/B testing config
    SELECT ab_testing_config INTO v_config
    FROM projects
    WHERE id = p_project_id AND ab_testing_enabled = true;
    
    IF v_config IS NULL THEN
        RETURN;
    END IF;
    
    -- Process each variant
    FOR v_variant IN 
        SELECT 
            value->>'name' as variant_name,
            value->>'model' as model
        FROM jsonb_array_elements(v_config->'variants')
    LOOP
        -- Aggregate metrics for this variant
        INSERT INTO ab_test_results (
            project_id,
            variant_name,
            model,
            total_requests,
            successful_requests,
            failed_requests,
            total_cost_usd,
            avg_cost_per_request,
            avg_latency_ms,
            avg_tokens_input,
            avg_tokens_output,
            cache_hit_rate,
            period_start,
            period_end
        )
        SELECT
            p_project_id,
            v_variant.variant_name,
            v_variant.model,
            COUNT(*),
            COUNT(*) FILTER (WHERE cost_usd >= 0),
            0, -- Failed requests would need error tracking
            SUM(cost_usd),
            AVG(cost_usd),
            ROUND(AVG(latency_ms))::INTEGER,
            ROUND(AVG(tokens_input))::INTEGER,
            ROUND(AVG(tokens_output))::INTEGER,
            ROUND((COUNT(*) FILTER (WHERE cached = true)::DECIMAL / COUNT(*)) * 100, 2),
            p_period_start,
            p_period_end
        FROM usage_logs
        WHERE project_id = p_project_id
            AND model = v_variant.model
            AND created_at >= p_period_start
            AND created_at < p_period_end
        ON CONFLICT (project_id, variant_name, period_start)
        DO UPDATE SET
            total_requests = EXCLUDED.total_requests,
            successful_requests = EXCLUDED.successful_requests,
            total_cost_usd = EXCLUDED.total_cost_usd,
            avg_cost_per_request = EXCLUDED.avg_cost_per_request,
            avg_latency_ms = EXCLUDED.avg_latency_ms,
            avg_tokens_input = EXCLUDED.avg_tokens_input,
            avg_tokens_output = EXCLUDED.avg_tokens_output,
            cache_hit_rate = EXCLUDED.cache_hit_rate,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_ab_test_results IS 'Aggregate A/B test metrics for configured variants';

-- ----------------------------------------------------------------------------
-- Step 6: Add triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_ab_test_results_updated_at
    BEFORE UPDATE ON ab_test_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Step 7: Enable RLS
-- ----------------------------------------------------------------------------
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_forecasts ENABLE ROW LEVEL SECURITY;

-- Users can view their own A/B test results
CREATE POLICY "Users can view own ab test results"
    ON ab_test_results FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can view their own cost forecasts
CREATE POLICY "Users can view own cost forecasts"
    ON cost_forecasts FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Service role can manage all
CREATE POLICY "Service role can manage ab test results"
    ON ab_test_results FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage cost forecasts"
    ON cost_forecasts FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Step 8: Grant permissions
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION calculate_cost_forecast TO authenticated;
GRANT EXECUTE ON FUNCTION update_ab_test_results TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 005 successful: Project configuration, A/B testing, and cost forecasting';
END $$;
