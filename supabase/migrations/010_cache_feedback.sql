-- ============================================================================
-- WatchLLM Database Schema
-- Migration: 010_cache_feedback.sql
-- Description: Add cache feedback table for user-reported cache accuracy issues
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Cache Feedback Table
-- Stores user feedback on whether cached responses were accurate
-- Used to auto-tune threshold recommendations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cache_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Request identification
    request_id TEXT NOT NULL, -- Can be usage_log id or request trace id
    
    -- Feedback data
    accurate BOOLEAN NOT NULL, -- Was the cached response correct?
    similarity_score DECIMAL(4, 3), -- The similarity score that triggered the cache hit (0.000-1.000)
    notes TEXT, -- Optional user notes about why it was inaccurate
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate feedback for same request
    CONSTRAINT cache_feedback_unique UNIQUE (project_id, request_id)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_cache_feedback_project 
    ON cache_feedback(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cache_feedback_accurate 
    ON cache_feedback(project_id, accurate);
CREATE INDEX IF NOT EXISTS idx_cache_feedback_similarity 
    ON cache_feedback(project_id, similarity_score);

COMMENT ON TABLE cache_feedback IS 'User feedback on semantic cache accuracy for threshold tuning';
COMMENT ON COLUMN cache_feedback.accurate IS 'Whether the cached response was correct for the query';
COMMENT ON COLUMN cache_feedback.similarity_score IS 'The similarity score when cache hit occurred (for threshold analysis)';
COMMENT ON COLUMN cache_feedback.notes IS 'Optional user notes explaining why the response was incorrect';

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE cache_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view feedback for their projects
CREATE POLICY "Users can view own project cache feedback"
    ON cache_feedback FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can insert feedback for their projects
CREATE POLICY "Users can insert cache feedback"
    ON cache_feedback FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can delete their own feedback
CREATE POLICY "Users can delete own cache feedback"
    ON cache_feedback FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Cache Accuracy Metrics View
-- Aggregated view for cache accuracy analytics
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW cache_accuracy_metrics AS
SELECT 
    project_id,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE accurate = true) as accurate_count,
    COUNT(*) FILTER (WHERE accurate = false) as inaccurate_count,
    ROUND(
        (COUNT(*) FILTER (WHERE accurate = true)::numeric / NULLIF(COUNT(*), 0) * 100), 
        2
    ) as accuracy_rate,
    ROUND(AVG(similarity_score) FILTER (WHERE accurate = false), 3) as avg_inaccurate_similarity,
    ROUND(AVG(similarity_score) FILTER (WHERE accurate = true), 3) as avg_accurate_similarity,
    MIN(created_at) as first_feedback_at,
    MAX(created_at) as last_feedback_at
FROM cache_feedback
GROUP BY project_id;

COMMENT ON VIEW cache_accuracy_metrics IS 'Aggregated cache accuracy metrics per project for threshold recommendations';

-- ----------------------------------------------------------------------------
-- Function to get threshold recommendation
-- Returns a suggested threshold based on feedback patterns
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_threshold_recommendation(p_project_id UUID)
RETURNS TABLE (
    current_threshold DECIMAL,
    recommended_threshold DECIMAL,
    reason TEXT,
    confidence TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_threshold DECIMAL;
    v_accuracy_rate DECIMAL;
    v_avg_inaccurate_similarity DECIMAL;
    v_total_feedback INTEGER;
BEGIN
    -- Get current project threshold
    SELECT semantic_cache_threshold INTO v_current_threshold
    FROM projects WHERE id = p_project_id;
    
    IF v_current_threshold IS NULL THEN
        v_current_threshold := 0.85;
    END IF;
    
    -- Get feedback metrics from last 30 days
    SELECT 
        accuracy_rate,
        avg_inaccurate_similarity,
        total_feedback
    INTO v_accuracy_rate, v_avg_inaccurate_similarity, v_total_feedback
    FROM cache_accuracy_metrics
    WHERE project_id = p_project_id;
    
    -- Not enough data
    IF v_total_feedback IS NULL OR v_total_feedback < 10 THEN
        RETURN QUERY SELECT 
            v_current_threshold,
            NULL::DECIMAL,
            'Not enough feedback data (need at least 10 responses)'::TEXT,
            'low'::TEXT;
        RETURN;
    END IF;
    
    -- High inaccuracy rate - recommend increasing threshold
    IF v_accuracy_rate < 90 THEN
        RETURN QUERY SELECT 
            v_current_threshold,
            LEAST(v_current_threshold + 0.03, 0.98),
            format('Accuracy rate is %.1f%%. Recommend increasing threshold for stricter matching.', v_accuracy_rate),
            CASE WHEN v_total_feedback >= 50 THEN 'high' ELSE 'medium' END;
        RETURN;
    END IF;
    
    -- Very high accuracy with strict threshold - could lower
    IF v_accuracy_rate >= 98 AND v_current_threshold >= 0.92 THEN
        RETURN QUERY SELECT 
            v_current_threshold,
            GREATEST(v_current_threshold - 0.02, 0.85),
            format('Accuracy is excellent (%.1f%%). Could lower threshold to increase cache savings.', v_accuracy_rate),
            CASE WHEN v_total_feedback >= 50 THEN 'high' ELSE 'medium' END;
        RETURN;
    END IF;
    
    -- Current threshold is good
    RETURN QUERY SELECT 
        v_current_threshold,
        NULL::DECIMAL,
        format('Current threshold is well-tuned. Accuracy rate: %.1f%%', v_accuracy_rate),
        CASE WHEN v_total_feedback >= 50 THEN 'high' ELSE 'medium' END;
END;
$$;

COMMENT ON FUNCTION get_threshold_recommendation IS 'Returns threshold adjustment recommendation based on user feedback patterns';
