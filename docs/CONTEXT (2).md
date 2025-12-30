# CONTEXT — Sentry for AI (Product Brain)

> This file is the single source of truth (the "brain") for the product: a full, exhaustive specification that guides engineering, product, marketing, sales, legal, and ops toward building a high‑MRR, high‑valuation AI observability platform.

---

## 1. Vision & Mission

**Vision:** Become the standard observability, debugging, governance and ROI layer for every AI/agent workflow — the "Sentry + Datadog + LangSmith" that every team integrates the moment they put LLMs into products.

**Mission:** Help teams ship AI features faster, at lower cost and risk, by giving them instant, actionable visibility into prompts, model calls, tool calls, pipeline health, costs, and failure modes.

---

## 2. Product Principles

1. **Developer-first:** one-line integrations, simple SDKs, predictable APIs.
2. **Privacy & Compliance by default:** PII minimization, encryption, GDPR/CCPA readiness.
3. **Actionable insights:** show root cause, not just a stack trace — surface the prompt, model response, tool call, and cost delta.
4. **Low-friction monetization:** high perceived value, easy to trial, clear upgrade path.
5. **Composable:** play nice with existing telemetry (OpenTelemetry, Datadog, Sentry), cloud, and infra.
6. **Explainable & auditable:** store versions of prompts, policies, hallucination checks, and model fingerprints to satisfy compliance and procurement.

---

## 3. Target Customers & Personas

* **Indie AI founders / solo devs** — fast feedback loops, will pay $9–39/mo for immediate value.
* **Early-stage AI startups (1–20 devs)** — need reliability, cost controls, will pay $49–499/mo.
* **Mid‑market / teams (20–200 devs)** — need governance, SSO, auditing, compliance, will pay $999–5k/mo.
* **Enterprise AI platforms** — require on‑prem/self-hosted options, contracts, SLAs, white‑glove onboarding.

Personas: LLM developer, ML engineer, platform engineer, product manager, CTO.

---

## 4. Core Problems We Solve

* Silent failures in LLM pipelines (a prompt "succeeds" but output is wrong).
* Unobserved cost spikes from bad prompts or runaway loops.
* Difficulty debugging toolcall/agent flows with chaining tools and side effects.
* No single timeline connecting user action → backend → model → tool call → output.
* No standardized eval/quality scoring across models and prompts.
* Poor alerting for AI-specific failure modes (hallucinations, model drift, policy violations).

---

## 5. Value Proposition (Why customers pay)

* Reduce MTTD/MTTR for AI failures by 10x.
* Save 20–60% on model spend via alerting / budget controls & prompt optimization insights.
* Reduce risk (hallucinations, data leakage) for regulated customers.
* Faster product iteration by surfacing which prompts fail and why.
* Compliance-ready logs for audits.

---

## 6. Feature Inventory — Core (MVP) + Growth + Enterprise

### 6.1 MVP (ship in 48–72 hours)

* **1-line SDK** (Python + JavaScript/Node) to capture: project, run_id, prompt, model, response, metadata, tokens, cost estimate.
* **HTTP ingestion API** with auth (API key + project scoping).
* **Dashboard:** timeline view of logs, searchable by run_id, prompt text, user_id, model, status.
* **Filters & basic charts:** request rate, avg latency, error rate, token usage per project.
* **Basic alerts:** webhook + email for job failures, error rate spikes, token/cost thresholds.
* **Billing + free tier**: e.g., 50k tokens / month free, pay-as-you-go or simple tiers.

### 6.2 Growth features (weeks 2–8)

* **Model & prompt diffing:** compare responses run-to-run, show changed tokens, highlight response deltas.
* **Toolcall visualization:** show chain of tool calls, timestamps, inputs/outputs.
* **Cost breakdown:** per-call, per-model, per-endpoint; anomalies detection for cost spikes.
* **Session replay (AI trace):** user action → prompt → response → downstream effects.
* **Releases & tags:** tag runs by release / commit to see regressions.
* **Playbooks / runbooks:** one‑click notifications for common failures.
* **Integrations:** Slack, PagerDuty, Datadog, OpenTelemetry, Zapier, WHOP for billing.
* **Self-serve onboarding + demo data** for instant "aha" moments.

### 6.3 Differentiators & Advanced

* **Hallucination detection:** heuristics + model ensemble checks + ground-truth verification hooks (RAG verification pipeline). Score outputs.
* **Automated prompt scorer:** A/B scoring and recommendations to reduce token use while preserving quality.
* **LLM Assertions:** allow devs to declare expected response shapes or invariants; auto-fail on breaches.
* **Agent step debugger:** step through each agent action, inspect toolcall payloads and outcomes, step replay, breakpoints.
* **Prompt versioning & diff history:** snapshot prompt templates and show which version caused regressions.
* **Synthetic monitoring:** run scheduled synthetic prompts to validate flows and detect regressions.
* **Security & policy scanning:** detect sensitive PII in prompts/responses; auto-mask or escalate.
* **Multi-model comparison UI:** compare responses across GPT, Claude, Llama, etc.

### 6.4 Enterprise / High-Value Features

* **SSO / SCIM / RBAC**
* **On‑prem / VPC deployment**
* **Encrypted-at-rest keys and HSM support**
* **Compliance: SOC2, ISO27001, HIPAA (optional)**
* **Retention customization & exportable audit trails**
* **Contracted SLAs & white‑glove onboarding**
* **Dedicated account manager, custom alerting, integration support**
* **Model governance & policy rules engine:** banned-terms, response filtering, required approvals.

---

## 7. Monetization & Pricing Ideas

**Principles:** low entry barrier, clear value thresholds, usage + seats hybrid.

* **Free tier:** 50k tokens / project; basic dashboard; community support.
* **Hobby:** $9/month — 500k tokens, basic alerts, email support.
* **Pro:** $49/month — 5M tokens, team seats, Slack alerts, simple SSO.
* **Team:** $199/month — 20M tokens, RBAC, integrations, synthetic checks.
* **Scale:** $999+/month — advanced alerts, dedicated SLA, VPC, custom retention.
* **Enterprise:** custom pricing, contracts, on‑prem.
* **Add-ons:** long retention, on‑demand exports, hallucination scanning credits, model comparison runs.
* **Professional services:** $X for onboarding, integration, runbook creation — upsell from WHOP gigs.

**MRR levers:** seat pricing, usage tiers, add‑ons (governance & retention), professional services, premium integrations.

---

## 8. Growth & GTM Playbook

1. **Ship in public:** daily build tweets, dev threads, demo GIFs of debugging sessions.
2. **Targeted outreach:** indie AI devs, repo owners, creators of LLM tools; DM + demo + free trial.
3. **Content & SEO:** docs, how-to guides ("Debugging your RAG pipeline"), prompt optimization case studies.
4. **Integration partners:** LangChain, LlamaIndex, Replit, Vercel, Supabase, WHOP listings.
5. **Product-led free plan:** ensure quick "aha" without onboarding.
6. **Community:** Discord for early adopters, templates library (assertions, runbooks).
7. **Paid marketing:** Twitter/X dev promo, Reddit r/MachineLearning / r/MLStartups, HackerNews launches.
8. **Referral / Affiliate:** $ credit for referrals; WHOP promotional hooks.
9. **Enterprise sales:** targeted ABM after ~50 paying teams.

---

## 9. Onboarding & Activation

* **One‑line install:** `pip install ai-sentry && ai_sentry.init(api_key)` or npm equivalent.
* **Auto ingest sample:** ship a sample script that logs 10 demo events and opens the dashboard at the exact run.
* **Guided tour & checklist:** verify SDK, send test prompt, create first alert, invite teammate.
* **Templates:** LLM assertions, cost thresholds, synthetic monitors.
* **First 7 days emails:** activation, tips, case study, invite to Discord.

---

## 10. Metrics (North Star) & OKRs

**North Star:** Number of paid teams * average revenue per team.

Key Metrics (daily/weekly):

* MRR, ARR
* CAC, LTV, LTV:CAC
* Trial→paid conversion rate
* Daily active projects / DAU for dashboards
* Avg tokens per project
* Alerts created per team
* Mean time to detect (MTTD) & mean time to resolve (MTTR)
* Churn rate (monthly)

OKR examples:

* O: Reach $5k MRR in 60 days. KR: 100 paying teams at avg $49/mo.
* O: Decrease onboarding time to <5 minutes. KR: 80% of trials perform a test log within 5 minutes.

---

## 11. Technical Architecture (High Level)

**Components:**

* Ingestion API (autoscale) behind rate limiting and API key auth.
* Stream processor (Kafka or serverless queue) to normalize events.
* Storage: hot store for recent logs (Elasticsearch / ClickHouse / Timescale) + cold archive (S3 + Parquet).
* Indexing & search: full text for prompts/responses, tags.
* Aggregation pipelines: nightly rollups for usage/cost metrics.
* UI backend: GraphQL/REST API for the dashboard.
* Frontend: React + Tailwind (or similar) with charts and timeline UI.
* SaaS infra: Terraform + k8s or serverless stack (Cloud Run / Fargate) depending on scale.
* Billing: Stripe + WHOP integration for distribution.

**Observability:** own Sentry for app errors, metrics (Prometheus/Grafana), cost alerts.

**Security:** API keys, per-project encryption keys, RBAC, audit logs.

---

## 12. Data Model / Events Schema (recommended)

**Event (prompt_call)**

```json
{
  "event_id": "uuid",
  "project_id": "string",
  "run_id": "string",
  "timestamp": "ISO8601",
  "user_id": "optional",
  "prompt": "string",
  "prompt_template_id": "optional",
  "model": "gpt-4o-mini",
  "model_version": "string",
  "tokens_input": 123,
  "tokens_output": 456,
  "cost_estimate_usd": 0.0123,
  "response": "string",
  "response_metadata": {"safety_score":0.2, "hallucination_score":0.6},
  "tool_calls": [{"tool_name":"search","input":"...","output":"...","latency_ms":120}],
  "status": "success|error|timeout|assertion_failed",
  "error": {"message":"...","stack":"..."},
  "tags": ["string"],
  "release": "git-sha",
  "env": "production|staging",
  "client": {"hostname":"","sdk_version":"1.0.0"}
}
```

**Indexed fields:** event_id, project_id, run_id, user_id, model, status, timestamp, tags, release.

---

## 13. SDK & API Contract (examples)

**Python quick example:**

```py
from aisentry import Client
c = Client(api_key="xxx")
run = c.log_prompt(project_id="p1", run_id="r1", prompt="Hi", model="gpt-4o-mini")
```

**HTTP example:**

```
POST /v1/projects/{project_id}/events
Authorization: Bearer <api_key>
Content-Type: application/json
{...event payload...}
```

Auth: API keys, optional JWT for server->server.

---

## 14. Security, Privacy & Compliance

* **PII policy:** provide a toggle to redact or hash prompt/response fields before storage. Default: redact sensitive fields.
* **Encryption:** TLS in transit; AES-256 at rest; customer managed keys for enterprise.
* **Retention:** default 90 days for free plan; paid plans: configurable retention up to 7 years for enterprise.
* **Access controls:** RBAC, SSO, SCIM.
* **Compliance roadmap:** SOC2 Type II → ISO27001 → HIPAA (if needed for medical customers).

---

## 15. Legal / Terms / Data Use

* Clear ToS/Privacy explaining that prompts may contain customer data and options for on‑prem or VPC deploy.
* Option: allow customers to opt in/out of anonymized aggregate analytics.
* Data residency options for EU / India / US.

---

## 16. Competitive Landscape & Positioning

**Direct / Near competitors:** LangSmith, Sentry (AI features), Datadog (if they extend to AI), Honeycomb (tracing), Monte Carlo (data quality), Weights & Biases (ML monitoring).

**Positioning:** developer-focused, cheaper, simplicity-first, rapid onboarding. Build unique hooks (agent step debugger, hallucination scoring, low-cost multi-model comparison).

**Moats to build:** SDK ecosystem, prompt/assertion templates, integrations, retained historical prompt corpus + analytics, governance features for compliance.

---

## 17. Acquisition & Exit Thesis

**Potential acquirers:** Observability vendors (Datadog, New Relic), AI infra companies (Cohere, Anthropic), AI devtools startups (Replit, Vercel), or large cloud providers.

**Signals that make acquisition likely:**

* 200–500 paying teams with >$300 ARPA and a consistent growth curve.
* Strong enterprise contracts with >$2k/mo ACV.
* Unique IP (agent debugger, hallucination detection) and a growing SDK ecosystem.

---

## 18. Roadmap & Milestones

**Week 0 (pre‑work)**

* Name, domain, basic brand, WHOP listing, Stripe account.
* Boilerplate repo with SDK skeletons.

**Day 0–3 (MVP)**

* Ingestion API + simple UI + Python/JS SDK + free tier.
* Marketing: build-in-public thread + demo video.

**Week 1–2**

* Billing, basic alerts, Slack integration, sample templates.

**Week 3–8**

* Advanced features (agent debugger, cost analytics, prompt diff), paid plans.

**Quarter 2**

* Multi-model comparison, hallucination scoring, and enterprise features (SSO, VPC).

**Year 1**

* Reach $X MRR (define target), expand to enterprise sales, start SOC2.

---

## 19. Sales & Support Playbooks

**Self-serve:** docs + in-app tutorial + Discord.
**High-touch:** template audit, runbook creation, alerting setup, POC assistance.
**Outbound:** identify AI product repos on GitHub, send tailored demos.
**Customer success:** health checks, usage reviews, model cost savings reports.

---

## 20. Growth Experiments & Hacks

* Offer free migration credits for users of LangSmith/other tools.
* Publish "prompt optimization" reports that show cost savings for customers (case studies).
* Viral demos of "agent step debugger" on Twitter/X and YouTube.
* Leverage WHOP and similar platforms for distribution + community.
* Templates marketplace: community-contributed assertions, runbooks, monitors.

---

## 21. Risks & Mitigations

* **Risk:** Data sensitivity (prompts contain PII). **Mitigation:** Redaction, on‑prem, VPC options.
* **Risk:** Big incumbents add similar features. **Mitigation:** Move fast, build SDK lockin, focus on developer experience and niche features.
* **Risk:** Low conversion from free to paid. **Mitigation:** Carefully design the free tier to be useful but limited at value inflection points (token caps, retention caps).

---

## 22. Appendix: Quick Launch Checklist

* [ ] pick name + domain
* [ ] create GitHub repo and initial SDK skeletons (python/js)
* [ ] spin up ingest API and simple UI (timeline)
* [ ] create demo script + demo data
* [ ] WHOP product page + Stripe
* [ ] build-in-public launch thread + short demo video
* [ ] track MRR, trials, activation time

---

*End of CONTEXT file.*
