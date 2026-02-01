-- Migration: Model Pricing Database
-- Creates database-driven pricing system with versioning and staleness tracking
-- Date: 2026-02-01

-- Model pricing table with versioning
CREATE TABLE IF NOT EXISTS model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'groq', 'openrouter'
  model TEXT NOT NULL,
  model_family TEXT, -- 'gpt-4', 'claude-3', etc. for grouping
  
  -- Pricing per 1M tokens (stored as cents for precision)
  input_price_per_million DECIMAL(12, 4) NOT NULL,
  output_price_per_million DECIMAL(12, 4) NOT NULL,
  
  -- Special pricing contexts
  batch_input_price_per_million DECIMAL(12, 4), -- 50% discount typically
  batch_output_price_per_million DECIMAL(12, 4),
  cached_input_price_per_million DECIMAL(12, 4), -- Anthropic prompt caching
  
  -- Metadata
  is_embedding_model BOOLEAN DEFAULT FALSE,
  is_fine_tuned BOOLEAN DEFAULT FALSE,
  context_window INTEGER,
  max_output_tokens INTEGER,
  
  -- Pricing source and verification
  source_url TEXT, -- Link to official pricing page
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by TEXT, -- 'manual', 'automated', 'admin'
  
  -- Versioning
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(provider, model, version)
);

-- Create indexes
CREATE INDEX idx_model_pricing_provider ON model_pricing(provider);
CREATE INDEX idx_model_pricing_model ON model_pricing(model);
CREATE INDEX idx_model_pricing_current ON model_pricing(is_current) WHERE is_current = TRUE;
CREATE INDEX idx_model_pricing_last_verified ON model_pricing(last_verified_at);

-- Pricing update log for audit trail
CREATE TABLE IF NOT EXISTS pricing_update_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_pricing_id UUID REFERENCES model_pricing(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  
  -- What changed
  old_input_price DECIMAL(12, 4),
  new_input_price DECIMAL(12, 4),
  old_output_price DECIMAL(12, 4),
  new_output_price DECIMAL(12, 4),
  
  -- Change metadata
  change_type TEXT NOT NULL, -- 'initial', 'update', 'verification', 'correction'
  change_reason TEXT,
  source_url TEXT,
  
  -- Who/what made the change
  updated_by TEXT, -- 'admin', 'automated_check', 'user_report'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing staleness alerts
CREATE TABLE IF NOT EXISTS pricing_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'stale_pricing', 'price_change_detected', 'verification_needed'
  provider TEXT,
  model TEXT,
  
  -- Alert details
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  
  -- Alert state
  is_active BOOLEAN DEFAULT TRUE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  resolved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost reconciliation for bill imports
CREATE TABLE IF NOT EXISTS cost_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Provider bill info
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'groq'
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  -- Costs
  provider_billed_amount DECIMAL(12, 4) NOT NULL, -- What provider actually charged
  watchllm_estimated_amount DECIMAL(12, 4) NOT NULL, -- Our estimate
  
  -- Variance analysis
  variance_amount DECIMAL(12, 4) GENERATED ALWAYS AS 
    (watchllm_estimated_amount - provider_billed_amount) STORED,
  variance_percentage DECIMAL(6, 4) GENERATED ALWAYS AS 
    (CASE WHEN provider_billed_amount > 0 
      THEN ((watchllm_estimated_amount - provider_billed_amount) / provider_billed_amount * 100)
      ELSE 0 
    END) STORED,
  
  -- Breakdown by model (JSON)
  provider_breakdown JSONB, -- From imported bill
  watchllm_breakdown JSONB, -- Our estimates
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'applied'
  notes TEXT,
  
  -- Timestamps
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

-- Create indexes for reconciliation
CREATE INDEX idx_cost_reconciliation_project ON cost_reconciliation(project_id);
CREATE INDEX idx_cost_reconciliation_provider ON cost_reconciliation(provider);
CREATE INDEX idx_cost_reconciliation_period ON cost_reconciliation(billing_period_start, billing_period_end);

-- RLS Policies
ALTER TABLE model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_update_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_reconciliation ENABLE ROW LEVEL SECURITY;

-- Model pricing is readable by all authenticated users
CREATE POLICY "Pricing readable by authenticated users" ON model_pricing
  FOR SELECT TO authenticated USING (TRUE);

-- Pricing update log is readable by all authenticated users
CREATE POLICY "Pricing log readable by authenticated users" ON pricing_update_log
  FOR SELECT TO authenticated USING (TRUE);

-- Pricing alerts are readable by all authenticated users
CREATE POLICY "Pricing alerts readable by authenticated users" ON pricing_alerts
  FOR SELECT TO authenticated USING (TRUE);

-- Cost reconciliation is per-project (user's own data)
CREATE POLICY "Users can view own reconciliation" ON cost_reconciliation
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reconciliation" ON cost_reconciliation
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Function to get current pricing for a model
CREATE OR REPLACE FUNCTION get_model_pricing(p_provider TEXT, p_model TEXT)
RETURNS TABLE (
  input_price_per_million DECIMAL,
  output_price_per_million DECIMAL,
  batch_input_price_per_million DECIMAL,
  batch_output_price_per_million DECIMAL,
  cached_input_price_per_million DECIMAL,
  last_verified_at TIMESTAMPTZ,
  is_stale BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.input_price_per_million,
    mp.output_price_per_million,
    mp.batch_input_price_per_million,
    mp.batch_output_price_per_million,
    mp.cached_input_price_per_million,
    mp.last_verified_at,
    (mp.last_verified_at < NOW() - INTERVAL '7 days') as is_stale
  FROM model_pricing mp
  WHERE mp.provider = p_provider 
    AND mp.model = p_model 
    AND mp.is_current = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for stale pricing
CREATE OR REPLACE FUNCTION check_stale_pricing()
RETURNS TABLE (
  provider TEXT,
  model TEXT,
  last_verified_at TIMESTAMPTZ,
  days_since_verification INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.provider,
    mp.model,
    mp.last_verified_at,
    EXTRACT(DAY FROM (NOW() - mp.last_verified_at))::INTEGER as days_since_verification
  FROM model_pricing mp
  WHERE mp.is_current = TRUE
    AND mp.last_verified_at < NOW() - INTERVAL '7 days'
  ORDER BY mp.last_verified_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate cost with current pricing
CREATE OR REPLACE FUNCTION calculate_request_cost(
  p_provider TEXT,
  p_model TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_is_batch BOOLEAN DEFAULT FALSE,
  p_cached_tokens INTEGER DEFAULT 0
) RETURNS DECIMAL AS $$
DECLARE
  v_input_price DECIMAL;
  v_output_price DECIMAL;
  v_cached_price DECIMAL;
  v_total_cost DECIMAL;
BEGIN
  -- Get current pricing
  SELECT 
    CASE WHEN p_is_batch AND batch_input_price_per_million IS NOT NULL 
      THEN batch_input_price_per_million 
      ELSE input_price_per_million 
    END,
    CASE WHEN p_is_batch AND batch_output_price_per_million IS NOT NULL 
      THEN batch_output_price_per_million 
      ELSE output_price_per_million 
    END,
    COALESCE(cached_input_price_per_million, input_price_per_million * 0.1) -- Default 90% discount for cached
  INTO v_input_price, v_output_price, v_cached_price
  FROM model_pricing
  WHERE provider = p_provider 
    AND model = p_model 
    AND is_current = TRUE
  LIMIT 1;
  
  -- If no pricing found, return 0
  IF v_input_price IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate cost
  -- Non-cached input tokens
  v_total_cost := ((p_input_tokens - p_cached_tokens) * v_input_price / 1000000);
  -- Cached tokens (discounted)
  v_total_cost := v_total_cost + (p_cached_tokens * v_cached_price / 1000000);
  -- Output tokens
  v_total_cost := v_total_cost + (p_output_tokens * v_output_price / 1000000);
  
  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed initial pricing data
INSERT INTO model_pricing (provider, model, model_family, input_price_per_million, output_price_per_million, batch_input_price_per_million, batch_output_price_per_million, context_window, max_output_tokens, source_url, verified_by) VALUES
-- OpenAI GPT-4 family
('openai', 'gpt-4', 'gpt-4', 30.00, 60.00, 15.00, 30.00, 8192, 8192, 'https://openai.com/pricing', 'manual'),
('openai', 'gpt-4-32k', 'gpt-4', 60.00, 120.00, 30.00, 60.00, 32768, 32768, 'https://openai.com/pricing', 'manual'),
('openai', 'gpt-4-turbo', 'gpt-4-turbo', 10.00, 30.00, 5.00, 15.00, 128000, 4096, 'https://openai.com/pricing', 'manual'),
('openai', 'gpt-4-turbo-preview', 'gpt-4-turbo', 10.00, 30.00, 5.00, 15.00, 128000, 4096, 'https://openai.com/pricing', 'manual'),
('openai', 'gpt-4o', 'gpt-4o', 5.00, 15.00, 2.50, 7.50, 128000, 16384, 'https://openai.com/pricing', 'manual'),
('openai', 'gpt-4o-mini', 'gpt-4o', 0.15, 0.60, 0.075, 0.30, 128000, 16384, 'https://openai.com/pricing', 'manual'),

-- OpenAI GPT-3.5 family
('openai', 'gpt-3.5-turbo', 'gpt-3.5', 0.50, 1.50, 0.25, 0.75, 16385, 4096, 'https://openai.com/pricing', 'manual'),
('openai', 'gpt-3.5-turbo-16k', 'gpt-3.5', 1.00, 2.00, 0.50, 1.00, 16385, 4096, 'https://openai.com/pricing', 'manual'),

-- OpenAI Embeddings (output price is 0 for embeddings)
('openai', 'text-embedding-ada-002', 'embedding', 0.10, 0, NULL, NULL, 8191, NULL, 'https://openai.com/pricing', 'manual'),
('openai', 'text-embedding-3-small', 'embedding', 0.02, 0, NULL, NULL, 8191, NULL, 'https://openai.com/pricing', 'manual'),
('openai', 'text-embedding-3-large', 'embedding', 0.13, 0, NULL, NULL, 8191, NULL, 'https://openai.com/pricing', 'manual'),

-- Anthropic Claude 3 family
('anthropic', 'claude-3-opus-20240229', 'claude-3-opus', 15.00, 75.00, NULL, NULL, 200000, 4096, 'https://anthropic.com/pricing', 'manual'),
('anthropic', 'claude-3-sonnet-20240229', 'claude-3-sonnet', 3.00, 15.00, NULL, NULL, 200000, 4096, 'https://anthropic.com/pricing', 'manual'),
('anthropic', 'claude-3-haiku-20240307', 'claude-3-haiku', 0.25, 1.25, NULL, NULL, 200000, 4096, 'https://anthropic.com/pricing', 'manual'),
('anthropic', 'claude-3-5-sonnet-20240620', 'claude-3.5-sonnet', 3.00, 15.00, NULL, NULL, 200000, 8192, 'https://anthropic.com/pricing', 'manual'),
('anthropic', 'claude-3-5-sonnet-20241022', 'claude-3.5-sonnet', 3.00, 15.00, NULL, NULL, 200000, 8192, 'https://anthropic.com/pricing', 'manual'),

-- Groq (heavily subsidized, very cheap)
('groq', 'llama-3.1-70b-versatile', 'llama-3.1', 0.59, 0.79, NULL, NULL, 131072, 8192, 'https://groq.com/pricing', 'manual'),
('groq', 'llama-3.1-8b-instant', 'llama-3.1', 0.05, 0.08, NULL, NULL, 131072, 8192, 'https://groq.com/pricing', 'manual'),
('groq', 'llama3-groq-70b-8192-tool-use-preview', 'llama-3', 0.89, 0.89, NULL, NULL, 8192, 8192, 'https://groq.com/pricing', 'manual'),
('groq', 'mixtral-8x7b-32768', 'mixtral', 0.24, 0.24, NULL, NULL, 32768, 32768, 'https://groq.com/pricing', 'manual'),
('groq', 'gemma2-9b-it', 'gemma', 0.20, 0.20, NULL, NULL, 8192, 8192, 'https://groq.com/pricing', 'manual')

ON CONFLICT (provider, model, version) DO UPDATE SET
  input_price_per_million = EXCLUDED.input_price_per_million,
  output_price_per_million = EXCLUDED.output_price_per_million,
  last_verified_at = NOW(),
  updated_at = NOW();

-- Set embedding model flags
UPDATE model_pricing 
SET is_embedding_model = TRUE 
WHERE model LIKE 'text-embedding%';

-- Add comment
COMMENT ON TABLE model_pricing IS 'Database-driven model pricing with versioning and staleness tracking. Prices are per 1M tokens.';
COMMENT ON TABLE cost_reconciliation IS 'Cost reconciliation records for comparing WatchLLM estimates against actual provider bills.';
