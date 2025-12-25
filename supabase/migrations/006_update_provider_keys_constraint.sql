-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 006_update_provider_keys_constraint.sql
-- Description: Update provider_keys table to support OpenRouter BYOK
-- ============================================================================

-- 1. Update the check constraint on provider_keys table
ALTER TABLE provider_keys 
DROP CONSTRAINT IF EXISTS provider_keys_provider_check;

ALTER TABLE provider_keys 
ADD CONSTRAINT provider_keys_provider_check 
CHECK (provider IN ('openai', 'anthropic', 'groq', 'openrouter'));

-- 2. Update the check constraint on usage_logs table
-- (Previously restricted to openai, anthropic, groq)
ALTER TABLE usage_logs 
DROP CONSTRAINT IF EXISTS usage_logs_provider_check;

ALTER TABLE usage_logs 
ADD CONSTRAINT usage_logs_provider_check 
CHECK (provider IN ('openai', 'anthropic', 'groq', 'openrouter'));

-- Add comment
COMMENT ON COLUMN provider_keys.provider IS 'AI provider (openai, anthropic, groq, openrouter)';
COMMENT ON COLUMN usage_logs.provider IS 'AI provider (openai, anthropic, groq, openrouter)';
