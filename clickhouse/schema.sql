-- ============================================================================
-- WatchLLM ClickHouse Schema
-- ============================================================================
-- This schema is designed for high-volume AI observability data ingestion
-- Based on: packages/shared/src/observability/types.ts
-- 
-- Design Principles:
-- 1. Optimized for time-series queries (partitioned by month)
-- 2. Efficient storage with compression
-- 3. Fast aggregations for analytics
-- 4. Support for nested data structures (tool_calls, metadata)
-- ============================================================================

-- ============================================================================
-- Main Events Table
-- ============================================================================
-- This table stores all observability events with a discriminator pattern
-- Different event types share the same table with nullable fields
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
    -- Primary identifiers
    event_id String,
    project_id String,
    run_id String,
    timestamp DateTime64(3),  -- Millisecond precision
    
    -- User and context
    user_id Nullable(String),
    tags Array(String),
    release Nullable(String),
    env Enum8('production' = 1, 'staging' = 2, 'development' = 3),
    
    -- Client information
    client_hostname Nullable(String),
    client_sdk_version Nullable(String),
    client_platform Nullable(String),
    
    -- Event type discriminator
    event_type Enum8(
        'prompt_call' = 1,
        'tool_call' = 2,
        'agent_step' = 3,
        'error' = 4,
        'assertion_failed' = 5,
        'hallucination_detected' = 6,
        'cost_threshold_exceeded' = 7,
        'performance_alert' = 8
    ),
    
    -- ========================================================================
    -- PromptCallEvent fields (event_type = 'prompt_call')
    -- ========================================================================
    prompt Nullable(String),
    prompt_template_id Nullable(String),
    model Nullable(String),
    model_version Nullable(String),
    tokens_input Nullable(Int32),
    tokens_output Nullable(Int32),
    cost_estimate_usd Nullable(Float64),
    response Nullable(String),
    response_metadata String DEFAULT '{}',  -- JSON string for metadata
    latency_ms Nullable(Int32),
    status Nullable(Enum8(
        'success' = 1,
        'error' = 2,
        'timeout' = 3,
        'assertion_failed' = 4,
        'warning' = 5
    )),
    
    -- Error information (shared across event types)
    error_message Nullable(String),
    error_type Nullable(String),
    error_code Nullable(String),
    error_stack Nullable(String),
    error_context String DEFAULT '{}',  -- JSON string
    
    -- ========================================================================
    -- AgentStepEvent fields (event_type = 'agent_step')
    -- ========================================================================
    step_number Nullable(Int32),
    step_name Nullable(String),
    step_type Nullable(Enum8(
        'reasoning' = 1,
        'tool_call' = 2,
        'validation' = 3,
        'output' = 4
    )),
    step_input_data String DEFAULT '{}',  -- JSON string
    step_output_data String DEFAULT '{}',  -- JSON string
    step_reasoning Nullable(String),
    step_context String DEFAULT '{}',  -- JSON string
    
    -- ========================================================================
    -- AssertionFailedEvent fields (event_type = 'assertion_failed')
    -- ========================================================================
    assertion_name Nullable(String),
    assertion_type Nullable(Enum8(
        'response_format' = 1,
        'content_filter' = 2,
        'safety_check' = 3,
        'custom' = 4
    )),
    assertion_expected String DEFAULT '{}',  -- JSON string
    assertion_actual String DEFAULT '{}',  -- JSON string
    assertion_severity Nullable(Enum8(
        'low' = 1,
        'medium' = 2,
        'high' = 3,
        'critical' = 4
    )),
    
    -- ========================================================================
    -- HallucinationDetectedEvent fields (event_type = 'hallucination_detected')
    -- ========================================================================
    hallucination_detection_method Nullable(Enum8(
        'heuristic' = 1,
        'model_ensemble' = 2,
        'ground_truth_verification' = 3
    )),
    hallucination_confidence_score Nullable(Float64),
    hallucination_flagged_content Nullable(String),
    hallucination_ground_truth Nullable(String),
    hallucination_recommendations Array(String),
    
    -- ========================================================================
    -- PerformanceAlertEvent fields (event_type = 'cost_threshold_exceeded' or 'performance_alert')
    -- ========================================================================
    alert_type Nullable(Enum8(
        'cost_spike' = 1,
        'latency_spike' = 2,
        'error_rate_spike' = 3,
        'token_limit' = 4
    )),
    alert_threshold Nullable(Float64),
    alert_actual_value Nullable(Float64),
    alert_window_minutes Nullable(Int32),
    alert_affected_models Array(String),
    
    -- ========================================================================
    -- Generic context field for additional data
    -- ========================================================================
    context String DEFAULT '{}',  -- JSON string for any additional context
    
    -- ========================================================================
    -- Indexes for fast queries
    -- ========================================================================
    INDEX idx_project_timestamp (project_id, timestamp) TYPE minmax GRANULARITY 1,
    INDEX idx_run_id (run_id) TYPE bloom_filter GRANULARITY 1,
    INDEX idx_user_id (user_id) TYPE bloom_filter GRANULARITY 1,
    INDEX idx_model (model) TYPE bloom_filter GRANULARITY 1,
    INDEX idx_status (status) TYPE set(0) GRANULARITY 1,
    INDEX idx_event_type (event_type) TYPE set(0) GRANULARITY 1
    
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)  -- Monthly partitions for efficient data management
ORDER BY (project_id, timestamp, event_id)
SETTINGS index_granularity = 8192;

-- ============================================================================
-- Tool Calls Table (Nested Data)
-- ============================================================================
-- Stores individual tool calls associated with prompt events
-- Linked via event_id to the main events table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tool_calls (
    event_id String,  -- Foreign key to events table
    project_id String,  -- Denormalized for efficient queries
    timestamp DateTime64(3),  -- Denormalized for partitioning
    
    -- Tool call details
    tool_name String,
    tool_id Nullable(String),
    tool_input String,  -- JSON string
    tool_output String,  -- JSON string
    latency_ms Int32,
    status Enum8(
        'success' = 1,
        'error' = 2,
        'timeout' = 3,
        'assertion_failed' = 4,
        'warning' = 5
    ),
    
    -- Error information
    error_message Nullable(String),
    error_type Nullable(String),
    error_code Nullable(String),
    
    INDEX idx_event_id (event_id) TYPE bloom_filter GRANULARITY 1,
    INDEX idx_tool_name (tool_name) TYPE bloom_filter GRANULARITY 1
    
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (project_id, timestamp, event_id)
SETTINGS index_granularity = 8192;

-- ============================================================================
-- Agent Steps Table (Detailed Workflow Tracking)
-- ============================================================================
-- Stores detailed agent step information for multi-step workflows
-- Separate from main events for better query performance
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_steps (
    event_id String,  -- Foreign key to events table
    project_id String,  -- Denormalized
    run_id String,  -- Denormalized for workflow queries
    timestamp DateTime64(3),
    
    -- Step details
    step_number Int32,
    step_name String,
    step_type Enum8(
        'reasoning' = 1,
        'tool_call' = 2,
        'validation' = 3,
        'output' = 4
    ),
    input_data String,  -- JSON string
    output_data String,  -- JSON string
    reasoning Nullable(String),
    context String DEFAULT '{}',  -- JSON string
    latency_ms Int32,
    status Enum8(
        'success' = 1,
        'error' = 2,
        'timeout' = 3,
        'assertion_failed' = 4,
        'warning' = 5
    ),
    
    -- Error information
    error_message Nullable(String),
    error_type Nullable(String),
    
    INDEX idx_run_id (run_id) TYPE bloom_filter GRANULARITY 1,
    INDEX idx_step_number (step_number) TYPE minmax GRANULARITY 1
    
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (project_id, run_id, step_number, timestamp)
SETTINGS index_granularity = 8192;

-- ============================================================================
-- Materialized Views for Common Aggregations
-- ============================================================================
-- These views pre-compute common metrics for fast dashboard queries
-- ============================================================================

-- Hourly metrics aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (project_id, hour, model)
AS SELECT
    project_id,
    toStartOfHour(timestamp) AS hour,
    model,
    event_type,
    status,
    count() AS request_count,
    sum(tokens_input) AS total_tokens_input,
    sum(tokens_output) AS total_tokens_output,
    sum(cost_estimate_usd) AS total_cost_usd,
    avg(latency_ms) AS avg_latency_ms,
    max(latency_ms) AS max_latency_ms,
    min(latency_ms) AS min_latency_ms
FROM events
WHERE event_type = 'prompt_call'
GROUP BY project_id, hour, model, event_type, status;

-- Daily metrics aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_metrics
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (project_id, day)
AS SELECT
    project_id,
    toDate(timestamp) AS day,
    count() AS total_requests,
    countIf(status = 'success') AS successful_requests,
    countIf(status = 'error') AS failed_requests,
    sum(tokens_input) AS total_tokens_input,
    sum(tokens_output) AS total_tokens_output,
    sum(cost_estimate_usd) AS total_cost_usd,
    avg(latency_ms) AS avg_latency_ms,
    countDistinct(model) AS unique_models_count
FROM events
WHERE event_type = 'prompt_call'
GROUP BY project_id, day;

-- ============================================================================
-- Helper Functions and Queries
-- ============================================================================

-- Function to get project summary
-- Usage: SELECT * FROM project_summary WHERE project_id = 'your-project-id'
CREATE VIEW IF NOT EXISTS project_summary AS
SELECT
    project_id,
    count() AS total_events,
    countIf(event_type = 'prompt_call') AS prompt_calls,
    countIf(event_type = 'error') AS errors,
    countIf(status = 'success') AS successful_events,
    sum(cost_estimate_usd) AS total_cost,
    avg(latency_ms) AS avg_latency,
    max(timestamp) AS last_event_time,
    min(timestamp) AS first_event_time
FROM events
GROUP BY project_id;

-- ============================================================================
-- Indexes for Full-Text Search (Optional)
-- ============================================================================
-- Uncomment if you need full-text search on prompts/responses
-- Note: This can increase storage and indexing time

-- ALTER TABLE events ADD INDEX idx_prompt_fulltext prompt TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 1;
-- ALTER TABLE events ADD INDEX idx_response_fulltext response TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 1;

-- ============================================================================
-- Sample Queries for Testing
-- ============================================================================

-- Get recent events for a project
-- SELECT * FROM events WHERE project_id = 'your-project' ORDER BY timestamp DESC LIMIT 100;

-- Get cost breakdown by model
-- SELECT model, sum(cost_estimate_usd) as total_cost, count() as requests 
-- FROM events WHERE project_id = 'your-project' AND event_type = 'prompt_call' 
-- GROUP BY model ORDER BY total_cost DESC;

-- Get error rate over time
-- SELECT toStartOfHour(timestamp) as hour, 
--        countIf(status = 'error') / count() * 100 as error_rate_pct
-- FROM events WHERE project_id = 'your-project' AND event_type = 'prompt_call'
-- GROUP BY hour ORDER BY hour DESC LIMIT 24;

-- Get agent workflow trace
-- SELECT * FROM agent_steps WHERE run_id = 'your-run-id' ORDER BY step_number;

-- ============================================================================
-- End of Schema
-- ============================================================================
