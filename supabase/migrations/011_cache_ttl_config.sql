-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 011_cache_ttl_config.sql
-- Description: Add configurable cache expiration (TTL) for project and endpoint levels
-- ============================================================================

-- Enable JSON extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "json";

-- ----------------------------------------------------------------------------
-- Step 1: Add TTL configuration to projects table
-- ----------------------------------------------------------------------------
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS cache_ttl_seconds INTEGER DEFAULT 86400 CHECK (cache_ttl_seconds > 0 OR cache_ttl_seconds = -1), -- -1 for never expire
ADD COLUMN IF NOT EXISTS cache_ttl_endpoint_overrides JSONB DEFAULT NULL;

COMMENT ON COLUMN projects.cache_ttl_seconds IS 'Default cache TTL in seconds (default 86400 = 24h, -1 = never expire). Max 2592000 (30 days).';
COMMENT ON COLUMN projects.cache_ttl_endpoint_overrides IS 'Per-endpoint TTL overrides: { "/v1/chat/completions": 3600, "/v1/embeddings": 604800 }';

-- Constrain TTL to reasonable values
ALTER TABLE projects
ADD CONSTRAINT cache_ttl_seconds_range CHECK (
  cache_ttl_seconds = -1 OR (cache_ttl_seconds >= 3600 AND cache_ttl_seconds <= 2592000)
);

CREATE INDEX IF NOT EXISTS idx_projects_cache_ttl ON projects(cache_ttl_seconds);

-- ----------------------------------------------------------------------------
-- Step 2: Create cache invalidation requests table
-- (For tracking webhook-triggered invalidations and cache purges)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cache_invalidations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Invalidation trigger
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'ttl_expiry', 'webhook', 'api')),
    triggered_by TEXT, -- User ID, webhook service name, or 'system' for TTL
    
    -- Filter criteria
    model_filter TEXT, -- Specific model or NULL for all
    endpoint_filter TEXT, -- Specific endpoint or NULL for all
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,
    similarity_threshold_min DECIMAL(5, 4), -- Only invalidate entries below this similarity
    
    -- Results
    entries_invalidated INTEGER DEFAULT 0,
    invalidated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT cache_invalidations_filters_check CHECK (
      model_filter IS NOT NULL OR endpoint_filter IS NOT NULL OR date_range_start IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_cache_invalidations_project ON cache_invalidations(project_id);
CREATE INDEX IF NOT EXISTS idx_cache_invalidations_trigger ON cache_invalidations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_cache_invalidations_date ON cache_invalidations(invalidated_at DESC);

COMMENT ON TABLE cache_invalidations IS 'Audit log for cache purges and TTL-based expirations';

-- ----------------------------------------------------------------------------
-- Step 3: Create webhook configuration table
-- (For programmatic cache invalidation triggers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cache_invalidation_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    webhook_url TEXT NOT NULL,
    webhook_secret TEXT NOT NULL, -- For HMAC signing
    
    -- Webhook trigger settings
    trigger_on_ttl BOOLEAN DEFAULT false, -- Notify when TTL entries expire
    trigger_on_manual BOOLEAN DEFAULT true, -- Notify on manual invalidations
    
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT cache_invalidation_webhooks_unique UNIQUE (project_id, webhook_url)
);

CREATE INDEX IF NOT EXISTS idx_cache_invalidation_webhooks_project ON cache_invalidation_webhooks(project_id);
CREATE INDEX IF NOT EXISTS idx_cache_invalidation_webhooks_active ON cache_invalidation_webhooks(is_active) WHERE is_active = true;

COMMENT ON TABLE cache_invalidation_webhooks IS 'Webhooks for receiving cache invalidation events';

-- ----------------------------------------------------------------------------
-- Step 4: Add cache age/expiration tracking to usage_logs
-- (For analytics on how old cached responses are)
-- ----------------------------------------------------------------------------
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS cache_created_at TIMESTAMPTZ, -- When the cached entry was created
ADD COLUMN IF NOT EXISTS cache_ttl_seconds INTEGER, -- TTL that was applied to this cache entry
ADD COLUMN IF NOT EXISTS cache_expired_at TIMESTAMPTZ; -- When cache entry would have expired (cache_created_at + cache_ttl_seconds)

COMMENT ON COLUMN usage_logs.cache_created_at IS 'Timestamp when the cached entry was created (populated only for cached hits)';
COMMENT ON COLUMN usage_logs.cache_ttl_seconds IS 'TTL in seconds applied to this cache entry';
COMMENT ON COLUMN usage_logs.cache_expired_at IS 'Calculated expiration time (cache_created_at + TTL)';

CREATE INDEX IF NOT EXISTS idx_usage_logs_cache_created ON usage_logs(cache_created_at DESC) WHERE cached = true;
CREATE INDEX IF NOT EXISTS idx_usage_logs_cache_expired ON usage_logs(cache_expired_at DESC) WHERE cached = true;

-- Add computed column for cache age (in hours)
-- This helps with analytics: if hit_time - cache_created_at is high, cache is old
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS cache_age_hours INTEGER GENERATED ALWAYS AS (
  CASE
    WHEN cached = true AND cache_created_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (created_at - cache_created_at)) / 3600
    ELSE NULL
  END
) STORED;

CREATE INDEX IF NOT EXISTS idx_usage_logs_cache_age ON usage_logs(cache_age_hours DESC) WHERE cached = true;

-- TTL preset options for frontend
-- Store as constants in worker and dashboard
