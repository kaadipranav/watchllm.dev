-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 013_provider_key_security.sql
-- Description: Enhanced security for provider API keys
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Create provider key access audit log table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_key_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    provider_key_id UUID NOT NULL REFERENCES provider_keys(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'groq', 'openrouter')),
    
    -- Access details
    access_type TEXT NOT NULL CHECK (access_type IN ('decrypt', 'validate', 'rotate', 'delete')),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    failure_reason TEXT,
    
    -- Request metadata
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    
    -- Timestamp
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT provider_key_access_logs_provider_valid CHECK (provider IN ('openai', 'anthropic', 'groq', 'openrouter')),
    CONSTRAINT provider_key_access_logs_access_type_valid CHECK (access_type IN ('decrypt', 'validate', 'rotate', 'delete'))
);

-- Add indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_provider_key_access_logs_project 
    ON provider_key_access_logs(project_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_key_access_logs_key 
    ON provider_key_access_logs(provider_key_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_key_access_logs_failed 
    ON provider_key_access_logs(project_id, success, accessed_at DESC) WHERE success = FALSE;

COMMENT ON TABLE provider_key_access_logs IS 'Audit log of every provider key access for security monitoring';
COMMENT ON COLUMN provider_key_access_logs.access_type IS 'Type of access: decrypt (use), validate (test), rotate (change), delete (remove)';
COMMENT ON COLUMN provider_key_access_logs.failure_reason IS 'Error message if decryption/access failed';

-- ----------------------------------------------------------------------------
-- Step 2: Add security metadata columns to provider_keys
-- ----------------------------------------------------------------------------
ALTER TABLE provider_keys
ADD COLUMN IF NOT EXISTS rotation_required_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_rotation_alert_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS access_anomaly_detected_at TIMESTAMPTZ;

COMMENT ON COLUMN provider_keys.rotation_required_at IS 'When key rotation becomes required (e.g., 90 days from creation)';
COMMENT ON COLUMN provider_keys.last_rotation_alert_sent_at IS 'When we last sent rotation reminder email';
COMMENT ON COLUMN provider_keys.access_anomaly_detected_at IS 'When unusual access pattern was last detected';

-- ----------------------------------------------------------------------------
-- Step 3: Row Level Security for audit logs
-- ----------------------------------------------------------------------------
ALTER TABLE provider_key_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project key access logs"
    ON provider_key_access_logs FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage key access logs"
    ON provider_key_access_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Step 4: Function to check key rotation requirements
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_key_rotation_requirements()
RETURNS TABLE (
    project_id UUID,
    provider_key_id UUID,
    provider TEXT,
    key_name TEXT,
    days_since_created INTEGER,
    days_since_last_used INTEGER,
    rotation_required BOOLEAN,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pk.project_id,
        pk.id AS provider_key_id,
        pk.provider,
        pk.name AS key_name,
        EXTRACT(DAY FROM NOW() - pk.created_at)::INTEGER AS days_since_created,
        COALESCE(EXTRACT(DAY FROM NOW() - pk.last_used_at)::INTEGER, 99999) AS days_since_last_used,
        CASE 
            WHEN EXTRACT(DAY FROM NOW() - pk.created_at) >= 90 THEN TRUE
            ELSE FALSE
        END AS rotation_required,
        CASE 
            WHEN EXTRACT(DAY FROM NOW() - pk.created_at) >= 90 THEN 'Key is older than 90 days'
            WHEN pk.last_used_at IS NULL THEN 'Key has never been used'
            WHEN EXTRACT(DAY FROM NOW() - pk.last_used_at) >= 30 THEN 'Key has not been used in 30+ days'
            ELSE 'Key is healthy'
        END AS reason
    FROM provider_keys pk
    WHERE pk.is_active = TRUE;
END;
$$;

COMMENT ON FUNCTION check_key_rotation_requirements IS 'Identify provider keys that should be rotated (>90 days old or unused)';

-- ----------------------------------------------------------------------------
-- Step 5: Function to detect unusual access patterns
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION detect_unusual_key_access(
    p_provider_key_id UUID,
    p_hours_back INTEGER DEFAULT 1
)
RETURNS TABLE (
    unusual_pattern BOOLEAN,
    access_count BIGINT,
    failure_count BIGINT,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_access_count BIGINT;
    v_failure_count BIGINT;
    v_rapid_access_count BIGINT;
BEGIN
    -- Count total accesses in time window
    SELECT COUNT(*) INTO v_access_count
    FROM provider_key_access_logs
    WHERE provider_key_id = p_provider_key_id
      AND accessed_at >= NOW() - (p_hours_back || ' hours')::INTERVAL;
    
    -- Count failures
    SELECT COUNT(*) INTO v_failure_count
    FROM provider_key_access_logs
    WHERE provider_key_id = p_provider_key_id
      AND success = FALSE
      AND accessed_at >= NOW() - (p_hours_back || ' hours')::INTERVAL;
    
    -- Count rapid accesses (>100 in 1 minute)
    SELECT COUNT(*) INTO v_rapid_access_count
    FROM provider_key_access_logs
    WHERE provider_key_id = p_provider_key_id
      AND accessed_at >= NOW() - INTERVAL '1 minute';
    
    -- Determine if pattern is unusual
    RETURN QUERY SELECT
        CASE 
            WHEN v_rapid_access_count >= 100 THEN TRUE
            WHEN v_access_count >= 10000 THEN TRUE
            WHEN v_failure_count >= 100 THEN TRUE
            ELSE FALSE
        END AS unusual_pattern,
        v_access_count,
        v_failure_count,
        CASE 
            WHEN v_rapid_access_count >= 100 THEN 'Rapid access: ' || v_rapid_access_count || ' accesses in last minute'
            WHEN v_access_count >= 10000 THEN 'High volume: ' || v_access_count || ' accesses in last ' || p_hours_back || ' hours'
            WHEN v_failure_count >= 100 THEN 'Many failures: ' || v_failure_count || ' failed attempts'
            ELSE 'Normal access pattern'
        END AS reason;
END;
$$;

COMMENT ON FUNCTION detect_unusual_key_access IS 'Detect unusual access patterns for security alerting';

-- ----------------------------------------------------------------------------
-- Step 6: View for key security dashboard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW provider_key_security_summary AS
SELECT 
    pk.id AS provider_key_id,
    pk.project_id,
    pk.provider,
    pk.name,
    pk.created_at,
    pk.last_used_at,
    EXTRACT(DAY FROM NOW() - pk.created_at)::INTEGER AS days_old,
    COALESCE(EXTRACT(DAY FROM NOW() - pk.last_used_at)::INTEGER, 0) AS days_since_last_use,
    
    -- Access statistics (last 24 hours)
    (SELECT COUNT(*) FROM provider_key_access_logs 
     WHERE provider_key_id = pk.id 
       AND accessed_at >= NOW() - INTERVAL '24 hours') AS accesses_24h,
    
    (SELECT COUNT(*) FROM provider_key_access_logs 
     WHERE provider_key_id = pk.id 
       AND success = FALSE
       AND accessed_at >= NOW() - INTERVAL '24 hours') AS failures_24h,
    
    -- Security flags
    CASE WHEN EXTRACT(DAY FROM NOW() - pk.created_at) >= 90 THEN TRUE ELSE FALSE END AS rotation_required,
    CASE WHEN pk.access_anomaly_detected_at IS NOT NULL 
         AND pk.access_anomaly_detected_at >= NOW() - INTERVAL '24 hours' 
         THEN TRUE ELSE FALSE END AS has_recent_anomaly,
    
    pk.is_active
FROM provider_keys pk
WHERE pk.is_active = TRUE;

COMMENT ON VIEW provider_key_security_summary IS 'Security overview of all active provider keys';
