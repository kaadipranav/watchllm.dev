-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 003_add_provider_keys.sql
-- Description: Add support for user-provided API keys (BYOK - Bring Your Own Key)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Provider Keys Table
-- Stores encrypted API keys for AI providers (OpenAI, Anthropic, Groq)
-- Users can optionally provide their own keys instead of using the global pool
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'groq')),
    encrypted_key TEXT NOT NULL,
    -- IV (Initialization Vector) for AES-GCM encryption, stored as base64
    encryption_iv TEXT NOT NULL,
    -- Optional: Key name/label for user reference
    name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    -- Ensure one active key per provider per project
    CONSTRAINT provider_keys_unique_active UNIQUE (project_id, provider, is_active) 
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT provider_keys_name_length CHECK (name IS NULL OR (LENGTH(name) >= 1 AND LENGTH(name) <= 100))
);

-- Add indexes for provider_keys
CREATE INDEX IF NOT EXISTS idx_provider_keys_project_id ON provider_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_provider_keys_provider ON provider_keys(provider);
CREATE INDEX IF NOT EXISTS idx_provider_keys_is_active ON provider_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_provider_keys_project_provider ON provider_keys(project_id, provider) WHERE is_active = true;

-- Add comment
COMMENT ON TABLE provider_keys IS 'User-provided encrypted API keys for AI providers (BYOK)';
COMMENT ON COLUMN provider_keys.encrypted_key IS 'AES-GCM encrypted API key (base64 encoded)';
COMMENT ON COLUMN provider_keys.encryption_iv IS 'Initialization vector for AES-GCM (base64 encoded)';

-- ----------------------------------------------------------------------------
-- Trigger: Auto-update updated_at
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_provider_keys_updated_at
    BEFORE UPDATE ON provider_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ----------------------------------------------------------------------------
ALTER TABLE provider_keys ENABLE ROW LEVEL SECURITY;

-- Users can view provider keys for their projects
CREATE POLICY "Users can view own provider keys"
    ON provider_keys FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can create provider keys for their projects
CREATE POLICY "Users can create provider keys"
    ON provider_keys FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can update their provider keys
CREATE POLICY "Users can update own provider keys"
    ON provider_keys FOR UPDATE
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

-- Users can delete their provider keys
CREATE POLICY "Users can delete own provider keys"
    ON provider_keys FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Service role can read provider keys (for worker to decrypt and use)
CREATE POLICY "Service role can read provider keys"
    ON provider_keys FOR SELECT
    USING (auth.role() = 'service_role');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify table was created
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'provider_keys'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Migration 003 successful: provider_keys table created';
    ELSE
        RAISE WARNING 'Migration 003 failed: provider_keys table not created';
    END IF;
END $$;
