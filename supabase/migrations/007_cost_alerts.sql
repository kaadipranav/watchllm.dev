-- Sent Alerts Table
-- Tracks which cost alerts have been sent to avoid duplicate notifications

CREATE TABLE IF NOT EXISTS sent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_key TEXT NOT NULL UNIQUE, -- Format: alert_{project_id}_{YYYY-MM}_{threshold}
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  threshold INTEGER NOT NULL, -- Percentage threshold (50, 75, 90, 95, 100)
  usage_at_alert INTEGER NOT NULL, -- Usage count when alert was sent
  limit_at_alert INTEGER NOT NULL, -- Plan limit when alert was sent
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_sent_alerts_alert_key ON sent_alerts(alert_key);
CREATE INDEX IF NOT EXISTS idx_sent_alerts_project_id ON sent_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_sent_alerts_user_id ON sent_alerts(user_id);

-- Auto-cleanup old alerts (keep only last 3 months)
-- This can be run as a scheduled function or cron job
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS void AS $$
BEGIN
  DELETE FROM sent_alerts 
  WHERE created_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql;

-- Add cost_alert_threshold column to projects table for custom thresholds
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS cost_alert_threshold INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS cost_alerts_enabled BOOLEAN DEFAULT true;

-- Comments
COMMENT ON TABLE sent_alerts IS 'Tracks sent cost alerts to prevent duplicate notifications';
COMMENT ON COLUMN projects.cost_alert_threshold IS 'Custom threshold (percentage) at which to send cost alerts. Default 80%.';
COMMENT ON COLUMN projects.cost_alerts_enabled IS 'Whether to send cost alerts for this project. Default true.';

-- RLS
ALTER TABLE sent_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sent alerts" ON sent_alerts;
CREATE POLICY "Users can view own sent alerts"
    ON sent_alerts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sent alerts" ON sent_alerts;
CREATE POLICY "Users can insert own sent alerts"
    ON sent_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sent alerts" ON sent_alerts;
CREATE POLICY "Users can delete own sent alerts"
    ON sent_alerts FOR DELETE
    USING (auth.uid() = user_id);
