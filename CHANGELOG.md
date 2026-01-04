# WatchLLM Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-01-04

#### ConfigCat Feature Flags Integration (Phase 5.1) ✅

- **Feature Flag Management** with ConfigCat SDK
  - Dashboard integration: `configcat-js-ssr` for Next.js server-side rendering
  - Worker integration: `configcat-node` for Cloudflare Workers
  - Auto-polling mode (60s) for dashboard, manual polling for worker
  - 13 total feature flags across dashboard and worker
  
- **Dashboard Feature Flags** (7 flags):
  - `guardianMode`: AI-powered hallucination detection
  - `advancedAnalytics`: Enhanced analytics features
  - `costForecasting`: Predictive cost analysis
  - `anomalyDetection`: Real-time anomaly alerts
  - `exportFeatures`: CSV/JSON data export
  - `webhooks`: Custom webhook notifications
  - `teamCollaboration`: Multi-user project access
  
- **Worker Feature Flags** (6 flags):
  - `guardianMode`: AI validation layer
  - `rateLimiting`: Usage quota enforcement
  - `costAlerts`: Real-time cost monitoring
  - `advancedCaching`: Enhanced caching strategies
  - `debugLogging`: Verbose troubleshooting logs
  - `maintenanceMode`: Graceful degradation
  
- **Developer Experience**:
  - Type-safe flag utilities with TypeScript
  - User-based targeting for percentage rollouts
  - Comprehensive documentation: `docs/CONFIGCAT_SETUP.md`
  - Environment variable configuration guides
  - Helper functions: isFeatureEnabled(), getFeatureFlagValue()
  - Force refresh capability for testing
  
- **Benefits**:
  - Deploy features without code changes
  - Gradual rollouts (percentage-based targeting)
  - User-specific feature access
  - Kill switch for problematic features
  - A/B testing capability
  
### Technical Notes
- Zero TypeScript errors across all packages
- ConfigCat free tier: Unlimited flags, 1000 MAU
- Polling overhead: Minimal (60s interval, local cache)
- Graceful fallback when ConfigCat unavailable

### Added - 2026-01-02 (Part 2)

#### Dashboard Analytics Integration (Phase 4.4) ✅

- **Main Dashboard Enhanced** with Analytics API integration
  - Dual metrics display: **Semantic Caching** + **Observability Insights**
  - New observability stats section with 4 cards:
    - **Total Events**: Count of all logged events in ClickHouse
    - **Average Latency**: Mean response time across all requests
    - **Total Cost**: Aggregate LLM spend in USD (6 decimal precision)
    - **Error Rate**: Percentage of failed requests
  - Automatic data fetching for projects with active provider keys
  - 7-day aggregation period matching caching stats
  - Direct link to detailed logs explorer
  - Loading states and graceful error handling
  - Maintains existing caching performance metrics
  
- **Data Flow**:
  - Supabase: Project management, user auth, caching usage logs
  - Analytics API: Observability events, aggregations, time-series
  - Combined view gives full picture: cost savings + operational health

### Technical Achievements
- **Phase 4 (Dashboard Data Layer): 100% COMPLETE** ✅
  - Task 4.1: Analytics API Client ✅
  - Task 4.2: Log Explorer Page ✅
  - Task 4.3: Event Detail View ✅
  - Task 4.4: Dashboard Integration ✅

- **Build Status**: Zero TypeScript errors, all packages compile
- **Test Coverage**: 71/71 tests passing (worker + SDKs)

### Infrastructure Summary
✅ Phase 1: Infrastructure (ClickHouse, Queues) - **COMPLETE**
✅ Phase 2: SDKs (Python, TypeScript) - **COMPLETE & PUBLISHED**
✅ Phase 3: Analytics API (4 endpoints) - **COMPLETE**
✅ Phase 4: Dashboard (Log Explorer, Stats) - **COMPLETE**

⏳ Phase 5: Advanced Features (ConfigCat, Billing Gates) - **PENDING**
⏳ Phase 6: Documentation & E2E Tests - **PENDING**

### What's Next
- Deploy infrastructure (ClickHouse Cloud, Cloudflare Worker, Vercel)
- Set up Stripe billing integration
- Add ConfigCat feature flags
- Write comprehensive E2E tests
- Production deployment

### Added - 2026-01-02 (Part 1)

#### SDK Publishing 📦
- **TypeScript/Node SDK published to npm** as `watchllm-sdk-node@0.1.0`
  - Full implementation with automatic batching and retry logic
  - PII redaction for emails and credit cards
  - Sampling support (0.0-1.0 rate)
  - Cost estimation for major models (GPT-4, Claude, etc.)
  - 15/15 tests passing
  - Installation: `npm install watchllm-sdk-node`
  - Package: https://www.npmjs.com/package/watchllm-sdk-node

- **Python SDK published to PyPI** as `watchllm@0.1.0`
  - Production-ready with background threading
  - Automatic batching and exponential backoff retry
  - Full type hints for IDE support
  - Installation: `pip install watchllm`
  - Package: https://pypi.org/project/watchllm/

#### Dashboard Data Integration (Phase 4.1-4.3) 🎨

- **Analytics API Client** in `dashboard/lib/analytics-api.ts`
  - Full TypeScript client for all 4 Analytics API endpoints
  - Type-safe interfaces matching API responses
  - Custom `AnalyticsAPIError` class with status codes
  - Timeout/abort controller support (30s default)
  - Helper methods: `getStatsLast24h()`, `getErrorLogs()`, `getRunLogs()`, etc.
  - Singleton pattern for React Server Components
  - Query string builder for complex filter parameters

- **Log Explorer Page** at `/dashboard/observability/logs`
  - Real-time Analytics API integration
  - Pagination with 50 events per page
  - Multi-filter support:
    - Status filter (all, success, error, timeout)
    - Model filter (GPT-4, Claude, etc.)
    - Client-side search (prompts, responses, event IDs)
  - Responsive card-based layout showing:
    - Event ID with truncation
    - Status badge with color coding
    - Model name and timestamp
    - Token count, cost (USD to 6 decimals), latency
    - Prompt and response previews (line-clamped)
    - Error messages when present
  - Click-through to detailed event view
  - Loading states and comprehensive error handling
  - Project selection via query parameter

- **Event Detail Page** at `/dashboard/observability/logs/[eventId]`
  - Complete event metadata display:
    - Model, latency, cost, tokens (input/output)
    - Formatted timestamp with timezone
    - Run ID, User ID, Tags
  - Copy-to-clipboard functionality for:
    - Event ID, Run ID
    - Prompt and response text
  - Full prompt/response display in code blocks
  - Tool calls visualization with JSON formatting
  - Response metadata JSON viewer
  - Error highlighting with alert styling
  - Status badges with semantic colors
  - Back navigation to log explorer

### Technical Improvements
- **Zero TypeScript compilation errors** across all packages
- **Test Coverage**: 71/71 tests passing (56 worker + 15 SDK)
- **Build verified**: Dashboard builds successfully with new pages
- **Navigation**: Sidebar routes to `/dashboard/observability/logs` ready

### Infrastructure Status Update
✅ Phase 1: Infrastructure Foundation - **COMPLETE**
✅ Phase 2: SDK & Ingestion - **COMPLETE**
  - Python SDK published to PyPI
  - TypeScript SDK published to npm
  - Enhanced validation in worker
  
✅ Phase 3.1: Analytics API - **COMPLETE**
✅ Phase 4.1-4.3: Dashboard Integration - **COMPLETE**
  - Analytics API client created
  - Log Explorer page built
  - Event Detail page built
  
⏳ Phase 4.4: Dashboard Charts - **IN PROGRESS**
  - Will add Recharts visualizations
  - Real-time stats cards
  - Time-series for cost/latency/usage

### Added - 2026-01-01

#### Dashboard Navigation Restructuring 🎨
- **Reorganized sidebar with semantic grouping** in `dashboard/components/dashboard/sidebar.tsx`
  - **Core Navigation** (always visible): Dashboard, Billing, Settings, Documentation
  - **Cost Savings** dropdown (collapsible): Projects, API Keys, Usage, A/B Testing
    - Groups all semantic caching features (the original WatchLLM MVP)
  - **Observability** dropdown (collapsible): Requests, Analytics, Traces
    - Groups all new observability/monitoring features
  
- **Created Observability page stubs** (ready for backend integration)
  - `/dashboard/observability/logs` - Request log explorer with filters
  - `/dashboard/observability/analytics` - Metrics dashboard and time-series charts
  - `/dashboard/observability/traces` - Detailed trace view with execution flow
  
- **Navigation best practices applied**
  - Core/essential pages at top level (Dashboard, Billing, Settings)
  - Feature-specific dropdowns to reduce cognitive load
  - Smooth chevron animations on dropdown toggle
  - Smart active state detection across dropdown sections
  - Default expanded state: Cost Savings (original product), Observability collapsed

- **Observability onboarding guidance**
  - Dashboard now has an Observability readiness card that summarizes how many projects have provider keys, explains ClickHouse retention controls, and points users to the logs and API keys pages.
  - Each of the new Observability pages (requests/analytics/traces) posts an inline callout reminding users that observability only starts once a project + provider key are configured.

#### Analytics API (Phase 3.1) ✅
- **Created comprehensive Analytics API** in `worker/src/handlers/analytics.ts`
  - `GET /v1/analytics/stats` - Project-wide statistics with date range filtering
    - Total requests, success/failure counts
    - Token usage (input/output)
    - Cost tracking with USD precision
    - Average latency and error rate
    - Top 5 models by usage
  - `GET /v1/analytics/timeseries` - Time-series data for charts
    - Configurable periods: 1h, 6h, 24h, 7d, 30d
    - Metrics: requests, cost, latency, errors
    - Automatic interval selection (5min to 1day granularity)
  - `GET /v1/analytics/logs` - Paginated event logs
    - Filtering by status, model, run_id
    - Limit/offset pagination
    - Returns total count and has_more flag
  - `GET /v1/analytics/event/:eventId` - Detailed event view
    - Full event data with metadata
    - Associated tool calls from separate table
    
- **Security & Access Control**
  - API key validation via Supabase integration
  - Project-level access control
  - Proper authorization error handling
  
- **Performance Optimizations**
  - Leverages ClickHouse aggregations for fast queries
  - Parameterized queries to prevent injection
  - Efficient indexing on project_id + timestamp
  
- **Mounted analytics routes** in `worker/src/index.ts`
  - Routes accessible at `/v1/analytics/*`
  - Integrated with existing auth middleware

### Technical Details
- **Database**: All queries use ClickHouse for high-performance analytics
- **Response Format**: JSON with proper type conversions (BigInt → Number)
- **Error Handling**: Comprehensive error logging and user-friendly error messages
- **Compatibility**: Ready for dashboard integration (Phase 4)

- **Environment parity**: Added ClickHouse connection placeholders to `worker/.env.example` and `dashboard/.env.example` so the frontend can mirror the worker's analytics host/credentials when wiring up the new API surface.

### Infrastructure Status
✅ Phase 1: Infrastructure Foundation - **COMPLETE**
  - ClickHouse schema and client
  - Cloudflare Queues for async ingestion
  - Queue consumer with batch processing
  
✅ Phase 2: SDK & Ingestion - **COMPLETE**
  - Python SDK published to PyPI (watchllm@0.1.0)
  - TypeScript SDK published to npm (watchllm-sdk-node@0.1.0)
  - Enhanced validation with detailed error messages
  
✅ Phase 3: Analytics API - **COMPLETE**
  - All 4 core analytics endpoints implemented
  - Time-series, stats, logs, event detail
  - Ready for dashboard consumption
  
✅ Phase 4: Dashboard Expansion - **COMPLETE**
  - Analytics API client with TypeScript types
  - Log Explorer with pagination and filters
  - Event Detail view with copy-to-clipboard
  - Main dashboard with dual metrics display
  
🚀 Phase 5: Advanced Features - **IN PROGRESS**
  - ✅ ConfigCat feature flags integration
  - ⏳ Datadog & Sentry verification
  - ⏳ Billing gates with usage limits
  
⏳ Phase 6: Documentation & Polish - **PENDING**
  - API documentation updates
  - E2E golden path testing
  - Production deployment guides

### Notes
- **Payment Integration**: Currently using Whop (switchable to Stripe via env)
- **Enterprise Features**: Intentionally excluded (SSO, SCIM, etc.) per solo dev constraints
- **Focus**: Developer-friendly features, fast iteration, actionable insights

---

## Previous Work (Before Changelog)

### Infrastructure
- Cloudflare Worker with Hono framework
- Supabase for user/project management
- ClickHouse schema for high-volume event storage
- Redis (Upstash) for caching
- Next.js dashboard skeleton

### Observability Events
- Event ingestion API at `/v1/projects/:projectId/events`
- Batch ingestion at `/v1/events/batch`
- Queue-based async processing
- Type-safe event schemas in `packages/shared`

### Security
- API key authentication
- Rate limiting (IP-based and key-based)
- CORS configuration
- PII handling considerations

---

## Future Roadmap

### Phase 4: Dashboard (Priority)
- Connect dashboard to Analytics API
- Build log explorer UI
- Real-time charts with Recharts
- Trace detail views

### Phase 5: Advanced Features
- ConfigCat feature flags
- Datadog/Sentry integration verification
- Billing gates (usage limits)
- Cost anomaly detection

### Phase 6: Polish
- Comprehensive E2E tests
- Updated documentation
- Performance benchmarks
- Production deployment guide
