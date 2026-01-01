# WatchLLM Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
  
✅ Phase 2: SDK & Ingestion - **PARTIAL**
  - Python SDK verified and ready
  - ⏳ Node/TypeScript SDK pending
  - ⏳ Enhanced validation pending
  
✅ Phase 3.1: Analytics API - **COMPLETE**
  - All core analytics endpoints implemented
  - Ready for dashboard consumption
  
⏳ Phase 3.2: Materialized Views - **PENDING**
  - Optional optimization for production scale
  
⏳ Phase 4: Dashboard Expansion - **NEXT**
  - Will migrate from Supabase to Analytics API
  - Real-time charts and log explorer

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
