-- =============================================================================
-- WatchLLM Self-Hosted - ClickHouse Initialization Script
-- =============================================================================
-- This script sets up the analytics schema for self-hosted deployments.
-- ClickHouse is optional but recommended for detailed analytics.
-- =============================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS watchllm;

-- =============================================================================
-- LLM Events Table (main analytics table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS watchllm.llm_events
(
    -- Event metadata
    event_id UUID DEFAULT generateUUIDv4(),
    event_type LowCardinality(String),
    event_time DateTime64(3) DEFAULT now64(3),
    
    -- Project/Key identification
    project_id String,
    api_key_id String,
    
    -- Request details
    provider LowCardinality(String),
    model LowCardinality(String),
    request_id String,
    
    -- Token counts
    tokens_input UInt32 DEFAULT 0,
    tokens_output UInt32 DEFAULT 0,
    tokens_total UInt32 DEFAULT 0,
    
    -- Cost tracking
    cost_usd Decimal64(6) DEFAULT 0,
    
    -- Performance
    latency_ms UInt32 DEFAULT 0,
    
    -- Caching
    cached UInt8 DEFAULT 0,
    cache_similarity Float32 DEFAULT 0,
    
    -- Status
    status_code UInt16 DEFAULT 200,
    error_message String DEFAULT '',
    
    -- Additional metadata
    metadata String DEFAULT '{}'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (project_id, event_time, event_id)
TTL event_time + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- =============================================================================
-- Daily Aggregates (materialized view)
-- =============================================================================
CREATE TABLE IF NOT EXISTS watchllm.daily_stats
(
    date Date,
    project_id String,
    provider LowCardinality(String),
    model LowCardinality(String),
    
    total_requests UInt64,
    cached_requests UInt64,
    failed_requests UInt64,
    
    total_tokens_input UInt64,
    total_tokens_output UInt64,
    total_cost Decimal64(6),
    
    avg_latency_ms Float64,
    p50_latency_ms Float64,
    p95_latency_ms Float64,
    p99_latency_ms Float64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, provider, model)
TTL date + INTERVAL 365 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS watchllm.daily_stats_mv
TO watchllm.daily_stats
AS SELECT
    toDate(event_time) as date,
    project_id,
    provider,
    model,
    count() as total_requests,
    countIf(cached = 1) as cached_requests,
    countIf(status_code >= 400) as failed_requests,
    sum(tokens_input) as total_tokens_input,
    sum(tokens_output) as total_tokens_output,
    sum(cost_usd) as total_cost,
    avg(latency_ms) as avg_latency_ms,
    quantile(0.5)(latency_ms) as p50_latency_ms,
    quantile(0.95)(latency_ms) as p95_latency_ms,
    quantile(0.99)(latency_ms) as p99_latency_ms
FROM watchllm.llm_events
GROUP BY date, project_id, provider, model;

-- =============================================================================
-- Hourly Aggregates (for real-time dashboards)
-- =============================================================================
CREATE TABLE IF NOT EXISTS watchllm.hourly_stats
(
    hour DateTime,
    project_id String,
    provider LowCardinality(String),
    
    total_requests UInt64,
    cached_requests UInt64,
    total_tokens UInt64,
    total_cost Decimal64(6),
    avg_latency_ms Float64
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (project_id, hour, provider)
TTL hour + INTERVAL 30 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS watchllm.hourly_stats_mv
TO watchllm.hourly_stats
AS SELECT
    toStartOfHour(event_time) as hour,
    project_id,
    provider,
    count() as total_requests,
    countIf(cached = 1) as cached_requests,
    sum(tokens_total) as total_tokens,
    sum(cost_usd) as total_cost,
    avg(latency_ms) as avg_latency_ms
FROM watchllm.llm_events
GROUP BY hour, project_id, provider;

-- =============================================================================
-- Model Usage Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS watchllm.model_usage
(
    date Date,
    project_id String,
    provider LowCardinality(String),
    model LowCardinality(String),
    
    request_count UInt64,
    token_count UInt64,
    cost Decimal64(6)
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, provider, model)
TTL date + INTERVAL 365 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS watchllm.model_usage_mv
TO watchllm.model_usage
AS SELECT
    toDate(event_time) as date,
    project_id,
    provider,
    model,
    count() as request_count,
    sum(tokens_total) as token_count,
    sum(cost_usd) as cost
FROM watchllm.llm_events
GROUP BY date, project_id, provider, model;

-- =============================================================================
-- Cache Performance Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS watchllm.cache_performance
(
    date Date,
    project_id String,
    model LowCardinality(String),
    
    total_requests UInt64,
    cache_hits UInt64,
    cache_misses UInt64,
    cost_saved Decimal64(6)
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (project_id, date, model)
TTL date + INTERVAL 365 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS watchllm.cache_performance_mv
TO watchllm.cache_performance
AS SELECT
    toDate(event_time) as date,
    project_id,
    model,
    count() as total_requests,
    countIf(cached = 1) as cache_hits,
    countIf(cached = 0) as cache_misses,
    sumIf(cost_usd, cached = 1) as cost_saved
FROM watchllm.llm_events
GROUP BY date, project_id, model;

-- =============================================================================
-- Error Tracking Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS watchllm.errors
(
    event_time DateTime64(3) DEFAULT now64(3),
    project_id String,
    provider LowCardinality(String),
    model LowCardinality(String),
    status_code UInt16,
    error_message String,
    request_id String
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (project_id, event_time)
TTL event_time + INTERVAL 30 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS watchllm.errors_mv
TO watchllm.errors
AS SELECT
    event_time,
    project_id,
    provider,
    model,
    status_code,
    error_message,
    request_id
FROM watchllm.llm_events
WHERE status_code >= 400;
