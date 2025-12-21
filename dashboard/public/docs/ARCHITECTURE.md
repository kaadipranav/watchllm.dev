# Architecture

WatchLLM is built for high-performance semantic caching and observability at the global edge.

## System Overview

The system is architected to minimize latency while providing robust governance over AI usage.

### 1. Edge Proxy (Cloudflare Workers)
The core "brain" of WatchLLM. It handles all incoming API requests under `/v1/*`.
- **Validation**: Performs millisecond-latency API key validation and plan lookup via Supabase.
- **Normalization**: Standardizes prompt message arrays and parameters into a canonical hash.
- **Semantic Engine**: Integrates with Pinecone or D1-backed vector storage to perform semantic similarity checks on prompt embeddings.
- **Provider Gateway**: A multi-client router that handles authentication and response mapping for OpenAI, Anthropic, and Groq.
- **Streaming**: Implements a passthrough transformer to inject headers and log usage without blocking the initial byte delivery.

### 2. Management Console (Next.js)
The unified dashboard for controlling your AI infrastructure.
- **Project Governance**: Set per-project rate limits, semantic thresholds, and provider configurations.
- **Observability**: Real-time visualization of usage logs powered by a highly-indexed PostgreSQL backend.
- **A/B Engine**: Configure traffic splits and variant rules for live model testing.
- **Billing & Subscriptions**: Integrated with Stripe for automated seat and usage-based billing.

### 3. Data & Infrastructure Layer
- **Persistent Source of Truth (Supabase)**: Stores project configurations, API keys, and detailed `usage_logs`.
- **Global In-Memory Cache (Upstash Redis)**: Provides sub-10ms response times for deterministic prompt hits and rate-limiting counters.
- **Vector Storage (Cloudflare D1)**: Stores prompt embeddings and their associated response data for semantic retrieval.

## Data Flow (Request Lifecycle)

1. **Ingress**: Client sends an OpenAI-compatible request to the Proxy domain.
2. **Auth & Limits**: Proxy validates the `lgw_` key and checks rate limits in Redis.
3. **Cache Lookup**: 
   - **Step A**: Exact match check in Redis.
   - **Step B**: (If Step A misses) Semantic similarity check in Vector store.
4. **Upstream Call**: (If Cache misses) Proxy forwards the request to the configured provider.
5. **Egress**: Proxy returns the response with `X-WatchLLM-*` headers and asynchronously logs the event for analytics.

## Performance & Scaling

- **Cold Start Optimization**: The worker package is minimized to ensure sub-100ms cold starts across the Cloudflare global network.
- **Asynchronous Logging**: Usage logging happens "out-of-band" so it never blocks the prompt response to the client.
- **Plan-Based Routing**: Traffic is prioritized based on the project's subscription tier.
