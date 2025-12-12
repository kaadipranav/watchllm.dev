-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Initial database setup for WatchLLM API proxy service
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Projects Table
-- Stores user projects (each user can have multiple projects)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT projects_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100)
);

-- Add indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_plan ON projects(plan);

-- Add comment
COMMENT ON TABLE projects IS 'User projects for organizing API keys and tracking usage';

-- ----------------------------------------------------------------------------
-- API Keys Table
-- Stores API keys for accessing the proxy service
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT api_keys_key_format CHECK (key ~ '^lgw_(proj|test)_[a-zA-Z0-9]{32,}$'),
    CONSTRAINT api_keys_name_length CHECK (name IS NULL OR (LENGTH(name) >= 1 AND LENGTH(name) <= 100))
);

-- Add indexes for api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_project_id ON api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used_at ON api_keys(last_used_at);

-- Add comment
COMMENT ON TABLE api_keys IS 'API keys for authenticating requests to the proxy service';

-- ----------------------------------------------------------------------------
-- Usage Logs Table
-- Tracks all API requests and their costs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'groq')),
    tokens_input INTEGER NOT NULL DEFAULT 0 CHECK (tokens_input >= 0),
    tokens_output INTEGER NOT NULL DEFAULT 0 CHECK (tokens_output >= 0),
    tokens_total INTEGER NOT NULL DEFAULT 0 CHECK (tokens_total >= 0),
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0 CHECK (cost_usd >= 0),
    cached BOOLEAN NOT NULL DEFAULT false,
    latency_ms INTEGER NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for usage_logs (optimized for common queries)
CREATE INDEX IF NOT EXISTS idx_usage_logs_project_id ON usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_project_created ON usage_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_cached ON usage_logs(cached);
CREATE INDEX IF NOT EXISTS idx_usage_logs_provider ON usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);

-- Add comment
COMMENT ON TABLE usage_logs IS 'Detailed logs of all API requests for analytics and billing';

-- ----------------------------------------------------------------------------
-- Subscriptions Table
-- Tracks user subscriptions and Stripe billing
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT subscriptions_unique_user UNIQUE (user_id)
);

-- Add indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

-- Add comment
COMMENT ON TABLE subscriptions IS 'User subscription information and Stripe integration';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Automatically update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: get_project_usage_stats
-- Get usage statistics for a project within a time range
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_project_usage_stats(
    p_project_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_requests BIGINT,
    cached_requests BIGINT,
    cache_hit_rate NUMERIC,
    total_tokens BIGINT,
    total_cost_usd NUMERIC,
    avg_latency_ms NUMERIC,
    requests_by_provider JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_requests,
        COUNT(*) FILTER (WHERE cached = true)::BIGINT AS cached_requests,
        ROUND(
            (COUNT(*) FILTER (WHERE cached = true)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC) * 100,
            2
        ) AS cache_hit_rate,
        COALESCE(SUM(tokens_total), 0)::BIGINT AS total_tokens,
        COALESCE(SUM(cost_usd), 0)::NUMERIC AS total_cost_usd,
        ROUND(AVG(latency_ms)::NUMERIC, 2) AS avg_latency_ms,
        COALESCE(
            jsonb_object_agg(
                provider,
                count
            ) FILTER (WHERE provider IS NOT NULL),
            '{}'::jsonb
        ) AS requests_by_provider
    FROM usage_logs
    LEFT JOIN LATERAL (
        SELECT provider, COUNT(*) as count
        FROM usage_logs
        WHERE project_id = p_project_id
            AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY provider
    ) provider_counts ON true
    WHERE project_id = p_project_id
        AND created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: get_monthly_request_count
-- Get request count for a project in the current month
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_monthly_request_count(p_project_id UUID)
RETURNS BIGINT AS $$
DECLARE
    request_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO request_count
    FROM usage_logs
    WHERE project_id = p_project_id
        AND created_at >= DATE_TRUNC('month', NOW());
    
    RETURN COALESCE(request_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: check_rate_limit
-- Check if API key has exceeded rate limit (using database)
-- Note: Primary rate limiting is done in Redis, this is for backup/analytics
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_api_key_id UUID,
    p_limit INTEGER,
    p_window_minutes INTEGER DEFAULT 1
)
RETURNS TABLE (
    is_allowed BOOLEAN,
    current_count BIGINT,
    reset_at TIMESTAMPTZ
) AS $$
DECLARE
    v_count BIGINT;
    v_window_start TIMESTAMPTZ;
    v_reset_at TIMESTAMPTZ;
BEGIN
    v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    v_reset_at := DATE_TRUNC('minute', NOW()) + (p_window_minutes || ' minutes')::INTERVAL;
    
    SELECT COUNT(*) INTO v_count
    FROM usage_logs
    WHERE api_key_id = p_api_key_id
        AND created_at >= v_window_start;
    
    RETURN QUERY
    SELECT 
        (v_count < p_limit) AS is_allowed,
        v_count AS current_count,
        v_reset_at AS reset_at;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: get_user_subscription
-- Get active subscription for a user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    plan TEXT,
    status TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_end TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.plan,
        s.status,
        s.stripe_customer_id,
        s.stripe_subscription_id,
        s.current_period_end
    FROM subscriptions s
    WHERE s.user_id = p_user_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for projects
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Projects RLS Policies
-- ----------------------------------------------------------------------------

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can create own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- API Keys RLS Policies
-- ----------------------------------------------------------------------------

-- Users can view API keys for their projects
CREATE POLICY "Users can view own API keys"
    ON api_keys FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can create API keys for their projects
CREATE POLICY "Users can create API keys"
    ON api_keys FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can update their API keys
CREATE POLICY "Users can update own API keys"
    ON api_keys FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can delete their API keys
CREATE POLICY "Users can delete own API keys"
    ON api_keys FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- ----------------------------------------------------------------------------
-- Usage Logs RLS Policies
-- ----------------------------------------------------------------------------

-- Users can view usage logs for their projects
CREATE POLICY "Users can view own usage logs"
    ON usage_logs FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Service role can insert usage logs (worker will use service role key)
CREATE POLICY "Service role can insert usage logs"
    ON usage_logs FOR INSERT
    WITH CHECK (true);

-- Users cannot update or delete usage logs (immutable)
-- No UPDATE or DELETE policies = no one can modify logs

-- ----------------------------------------------------------------------------
-- Subscriptions RLS Policies
-- ----------------------------------------------------------------------------

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can create own subscription"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can manage all subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create a default subscription for new users (can be done via trigger if needed)
-- For now, this is handled in the application layer

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on sequences (if any)
-- None needed for UUID primary keys

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_project_usage_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_request_count TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_project_usage_stats IS 'Get comprehensive usage statistics for a project';
COMMENT ON FUNCTION get_monthly_request_count IS 'Get total request count for current month';
COMMENT ON FUNCTION check_rate_limit IS 'Check if API key has exceeded rate limit';
COMMENT ON FUNCTION get_user_subscription IS 'Get active subscription details for a user';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name IN ('projects', 'api_keys', 'usage_logs', 'subscriptions');
    
    IF table_count = 4 THEN
        RAISE NOTICE 'Migration successful: All 4 tables created';
    ELSE
        RAISE WARNING 'Migration incomplete: Only % tables created', table_count;
    END IF;
END $$;
