-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 009_fix_sent_alerts_rls.sql
-- Description: Enable RLS for sent_alerts table
-- ============================================================================

-- Enable RLS
ALTER TABLE sent_alerts ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- sent_alerts RLS Policies (Idempotent)
-- ----------------------------------------------------------------------------

-- Users can view their own sent alerts
DROP POLICY IF EXISTS "Users can view own sent alerts" ON sent_alerts;
CREATE POLICY "Users can view own sent alerts"
    ON sent_alerts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own sent alerts
DROP POLICY IF EXISTS "Users can insert own sent alerts" ON sent_alerts;
CREATE POLICY "Users can insert own sent alerts"
    ON sent_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sent alerts
DROP POLICY IF EXISTS "Users can delete own sent alerts" ON sent_alerts;
CREATE POLICY "Users can delete own sent alerts"
    ON sent_alerts FOR DELETE
    USING (auth.uid() = user_id);

-- Note: No UPDATE policy needed as sent_alerts are usually immutable logs
