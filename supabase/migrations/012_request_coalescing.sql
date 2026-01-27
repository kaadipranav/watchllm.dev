-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 012_request_coalescing.sql
-- Description: Track request coalescing (deduplication) metrics
-- ============================================================================

-- Add coalescing fields to usage_logs for analytics
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS coalesced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS coalesced_group_size INTEGER DEFAULT 0 CHECK (coalesced_group_size >= 0);

COMMENT ON COLUMN usage_logs.coalesced IS 'True when the response was served via request coalescing/deduplication';
COMMENT ON COLUMN usage_logs.coalesced_group_size IS 'Number of queued identical requests satisfied by this leader response (followers served from cache)';

CREATE INDEX IF NOT EXISTS idx_usage_logs_coalesced ON usage_logs(coalesced);
