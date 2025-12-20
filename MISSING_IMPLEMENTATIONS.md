# WatchLLM Missing Implementations & Bugs

## 📈 Rate Limiting & Quotas
- [x] **Monthly Quota Enforcement**: ✅ FIXED - Handlers now check monthly usage and return 429 when plan limits are exceeded.
- [x] **Usage Alert Emails**: ✅ VERIFIED - Full implementation exists: worker triggers webhook at 80% usage, dashboard sends email via Resend.

## 🔑 Provider API Key Management (BYOK)
- [x] **User Key Storage**: ✅ IMPLEMENTED - Database schema created with `provider_keys` table, RLS policies in place.
- [x] **Encryption/Decryption**: ✅ IMPLEMENTED - AES-GCM encryption with PBKDF2 key derivation in `crypto.ts`.
- [x] **BYOK Routing**: ✅ IMPLEMENTED - `providers.ts` prioritizes user's decrypted key over global OpenRouter fallback.

## 📊 Usage Tracking & Analytics
- [ ] **Dashboard Aggregations**: Handlers log raw rows, but we need scheduled jobs or database functions to pre-calculate hourly/daily aggregations for fast dashboard loading.
- [ ] **Cache Cost Savings**: Need to explicitly track "Potential Cost" vs "Actual Cost" in `usage_logs` to calculate "$ Saved" metrics.

## 📚 Documentation
- [ ] **Dedicated Troubleshooting Guide**: Create a specific section or file for common issues (e.g., header mismatches, D1 connection errors).
- [ ] **Code Examples for Go/Ruby**: Expand the `API.md` to include more language examples beyond JS/Python/cURL.

## � Security
- [ ] **IP-Based Rate Limiting**: Implement a secondary rate limit layer based on client IP to prevent coordinated attacks on a single project's API key.
- [ ] **Provider Health Check**: Add a check to `health/detailed` that pings the OpenRouter status/models endpoint to verify provider availability.

## ✨ Nice-to-Haves (Future)
- [ ] **Project-Level Thresholds**: Allow users to configure the semantic similarity threshold (e.g., 0.90 for banking, 0.70 for casual chat) in their project settings.
- [ ] **A/B Testing Engine**: Logic to split-test different models (e.g., 50% Gpt-4o, 50% Claude-3.5) for performance comparison.
- [ ] **Cost Forecasting**: Predictive analytics based on historical usage logs to estimate end-of-month spend.
