-- Add streaming flags to usage logs for cache hit rate and usage split metrics
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS is_streaming BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN usage_logs.is_streaming IS 'True when the request was served as a streaming response (SSE).';

CREATE INDEX IF NOT EXISTS idx_usage_logs_streaming ON usage_logs(is_streaming) WHERE is_streaming = true;
