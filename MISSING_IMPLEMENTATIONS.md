# WatchLLM Missing Implementations & Bugs

## 📈 Rate Limiting & Quotas
- [x] **Monthly Quota Enforcement**: ✅ FIXED - Handlers now check monthly usage and return 429 when plan limits are exceeded.
- [x] **Usage Alert Emails**: ✅ VERIFIED - Full implementation exists: worker triggers webhook at 80% usage, dashboard sends email via Resend.

## 🔑 Provider API Key Management (BYOK)
- [x] **User Key Storage**: ✅ IMPLEMENTED - Database schema created with `provider_keys` table, RLS policies in place.
- [x] **Encryption/Decryption**: ✅ IMPLEMENTED - AES-GCM encryption with PBKDF2 key derivation in `crypto.ts`.
- [x] **BYOK Routing**: ✅ IMPLEMENTED - `providers.ts` prioritizes user's decrypted key over global OpenRouter fallback.

## 📊 Usage Tracking & Analytics
- [x] **Dashboard Aggregations**: ✅ IMPLEMENTED - Created hourly/daily aggregation tables with database functions for fast dashboard queries.
- [x] **Cache Cost Savings**: ✅ IMPLEMENTED - Added `potential_cost_usd` column to track "Potential Cost" vs "Actual Cost" for calculating "$ Saved" metrics.

## 📚 Documentation
- [x] **Dedicated Troubleshooting Guide**: ✅ IMPLEMENTED - Created `docs/TROUBLESHOOTING.md` covering auth, D1, caching, and more.
- [x] **Code Examples for Go/Ruby**: ✅ IMPLEMENTED - Added official examples to `docs/API.md`.

## 🔒 Security
- [x] **IP-Based Rate Limiting**: ✅ IMPLEMENTED - Added secondary rate limit layer in `security.ts` with burst protection, suspicious activity detection, and IP blocking.
- [x] **Provider Health Check**: ✅ IMPLEMENTED - Added `checkProviderHealth` that pings OpenRouter's models endpoint, integrated into `/health/detailed`.

## ✨ Nice-to-Haves (Future)
- [ ] **Project-Level Thresholds**: Allow users to configure the semantic similarity threshold (e.g., 0.90 for banking, 0.70 for casual chat) in their project settings.
- [ ] **A/B Testing Engine**: Logic to split-test different models (e.g., 50% Gpt-4o, 50% Claude-3.5) for performance comparison.
- [ ] **Cost Forecasting**: Predictive analytics based on historical usage logs to estimate end-of-month spend.
