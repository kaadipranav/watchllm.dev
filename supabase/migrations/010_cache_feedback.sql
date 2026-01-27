-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 010_cache_feedback.sql
-- Description: Add cache review metadata and raise semantic cache default
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Increase default semantic cache threshold to 95%
-- ----------------------------------------------------------------------------
ALTER TABLE projects
ALTER COLUMN semantic_cache_threshold SET DEFAULT 0.95;

-- Only update rows that were using the old default/null
UPDATE projects
SET semantic_cache_threshold = 0.95
WHERE semantic_cache_threshold IS NULL OR semantic_cache_threshold = 0.85;

COMMENT ON COLUMN projects.semantic_cache_threshold IS 'Similarity threshold for semantic caching (0.50-0.99). Default 0.95 for stricter matching.';

-- ----------------------------------------------------------------------------
-- Step 2: Cache review + similarity metadata on usage logs
-- ----------------------------------------------------------------------------
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS cache_decision TEXT DEFAULT 'none' CHECK (cache_decision IN ('none', 'deterministic', 'semantic')),
ADD COLUMN IF NOT EXISTS cache_similarity DECIMAL(5, 4) CHECK (cache_similarity >= 0 AND cache_similarity <= 1),
ADD COLUMN IF NOT EXISTS cache_flagged_incorrect BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cache_review_note TEXT,
ADD COLUMN IF NOT EXISTS cache_reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN usage_logs.cache_decision IS 'How the cache was decided: deterministic key match, semantic similarity, or none.';
COMMENT ON COLUMN usage_logs.cache_similarity IS 'Semantic similarity score for cache hits (0.0 - 1.0).';
COMMENT ON COLUMN usage_logs.cache_flagged_incorrect IS 'Set to true when a cached response is manually flagged as incorrect.';
COMMENT ON COLUMN usage_logs.cache_review_note IS 'Optional note provided during cache manual review.';
COMMENT ON COLUMN usage_logs.cache_reviewed_at IS 'Timestamp when the cache entry was reviewed/flagged.';

CREATE INDEX IF NOT EXISTS idx_usage_logs_cache_decision ON usage_logs(cache_decision);
CREATE INDEX IF NOT EXISTS idx_usage_logs_cache_flagged ON usage_logs(cache_flagged_incorrect);
