-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 007_multiple_keys_per_provider.sql
-- Description: Allow multiple API keys per provider (max 3 per provider)
-- ============================================================================

-- 1. Drop the existing unique constraint that limits to one active key per provider
ALTER TABLE provider_keys 
DROP CONSTRAINT IF EXISTS provider_keys_unique_active;

-- 2. Create a function to check key count before insert
CREATE OR REPLACE FUNCTION check_provider_key_limit()
RETURNS TRIGGER AS $$
DECLARE
    key_count INTEGER;
BEGIN
    -- Count existing active keys for this project + provider
    SELECT COUNT(*) INTO key_count
    FROM provider_keys
    WHERE project_id = NEW.project_id
      AND provider = NEW.provider
      AND is_active = true;
    
    -- Allow max 3 active keys per provider
    IF key_count >= 3 THEN
        RAISE EXCEPTION 'Maximum of 3 active keys allowed per provider. Please deactivate an existing key first.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to enforce the limit
DROP TRIGGER IF EXISTS enforce_provider_key_limit ON provider_keys;
CREATE TRIGGER enforce_provider_key_limit
    BEFORE INSERT ON provider_keys
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION check_provider_key_limit();

-- 4. Add a priority field for key rotation (1 = highest priority)
ALTER TABLE provider_keys 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3);

-- 5. Create index for efficient key selection
CREATE INDEX IF NOT EXISTS idx_provider_keys_priority 
ON provider_keys(project_id, provider, priority) 
WHERE is_active = true;

-- 6. Update comment
COMMENT ON TABLE provider_keys IS 'User-provided encrypted API keys for AI providers (BYOK). Max 3 active keys per provider.';
COMMENT ON COLUMN provider_keys.priority IS 'Key priority for rotation (1 = highest, used first)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

RAISE NOTICE 'Migration 007 successful: Multiple keys per provider enabled (max 3)';
