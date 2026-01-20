# WatchLLM Enterprise Self-Hosting Guide

**Complete deployment guide for running WatchLLM in your own infrastructure**

---

## Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Architecture](#architecture)
- [Quick Start (Development)](#quick-start-development)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Security & Compliance](#security--compliance)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Backup & Disaster Recovery](#backup--disaster-recovery)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## Overview

WatchLLM Self-Hosted Edition allows enterprises to run the complete WatchLLM platform within their own infrastructure. This is ideal for organizations with:

- **Data Sovereignty Requirements**: All data (prompts, responses, traces) stays within your VPC
- **Compliance Needs**: HIPAA, SOC 2, GDPR, or industry-specific regulations
- **Air-Gapped Environments**: Deployments without internet access
- **Custom SLA Requirements**: Full control over uptime and performance

### What You Get

✅ **Complete Platform**: Dashboard, API Proxy, Agent Debugger, ROI Attribution, Marketplace  
✅ **Semantic Caching**: 40-70% cost reduction on LLM calls  
✅ **Analytics Engine**: ClickHouse-powered real-time analytics  
✅ **Full SDK Support**: Python & Node.js SDKs with LangChain integration  
✅ **Enterprise Features**: Audit logs, advanced analytics, priority support  

### What's Different from Cloud

❌ No dependency on watchllm.dev infrastructure  
❌ No data leaves your network  
❌ No usage-based billing (flat license fee)  
❌ Requires valid enterprise license  

---

## System Requirements

### Minimum (Development/Testing)

| Resource | Requirement |
|----------|-------------|
| **CPU** | 2 cores |
| **RAM** | 4 GB |
| **Storage** | 20 GB SSD |
| **OS** | Linux (Ubuntu 22.04+ recommended), macOS, Windows with WSL2 |
| **Software** | Docker 24+, Docker Compose 2.20+ |

### Recommended (Production)

| Resource | Requirement |
|----------|-------------|
| **CPU** | 4-8 cores |
| **RAM** | 8-16 GB |
| **Storage** | 100+ GB SSD (depends on traffic volume) |
| **Network** | Low latency connection to LLM providers (OpenAI, Anthropic, etc.) |
| **OS** | Ubuntu 22.04 LTS or RHEL 8+ |

### High-Scale (Enterprise)

| Resource | Requirement |
|----------|-------------|
| **CPU** | 16+ cores |
| **RAM** | 32+ GB |
| **Storage** | 500+ GB NVMe SSD (or external S3-compatible storage) |
| **Database** | Dedicated PostgreSQL cluster (RDS, CloudSQL, etc.) |
| **Cache** | Dedicated Redis cluster (ElastiCache, MemoryStore, etc.) |
| **Analytics** | ClickHouse cluster (3+ nodes) |
| **Load Balancer** | NGINX, HAProxy, or cloud LB (ALB, Cloud Load Balancing) |

---

## Architecture

WatchLLM Self-Hosted consists of 4 core services:

```
┌─────────────────────────────────────────────────────────────┐
│                    WatchLLM Application                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Dashboard (Next.js 14)                                 │ │
│  │  - User Interface                                       │ │
│  │  - Project Management                                   │ │
│  │  - Analytics & Visualizations                           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Proxy (Hono on Node.js)                           │ │
│  │  - OpenAI-compatible /v1/* endpoints                    │ │
│  │  - Semantic caching logic                               │ │
│  │  - Request forwarding to LLM providers                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ▼
         ┌──────────────────────────────────────┐
         │                                      │
    ┌────▼─────┐    ┌─────────┐    ┌──────────▼────┐
    │PostgreSQL│    │  Redis  │    │  ClickHouse   │
    │(Metadata)│    │(Caching)│    │  (Analytics)  │
    └──────────┘    └─────────┘    └───────────────┘
```

### Service Details

| Service | Purpose | Port | Required | Data Stored |
|---------|---------|------|----------|-------------|
| **WatchLLM** | Dashboard & API | 3000 | ✅ Yes | None (stateless) |
| **PostgreSQL** | Metadata storage | 5432 | ✅ Yes | Users, projects, API keys, usage logs |
| **Redis** | Caching & rate limiting | 6379 | ✅ Yes | Semantic cache, rate limit counters |
| **ClickHouse** | Analytics | 8123 | ⚠️ Optional | Detailed event logs, time-series data |

---

## Quick Start (Development)

### Prerequisites

1. **Install Docker & Docker Compose**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   
   # macOS (Docker Desktop)
   brew install --cask docker
   
   # Verify installation
   docker --version
   docker-compose --version
   ```

2. **Obtain Enterprise License**
   - Contact enterprise@watchllm.dev to get your license file
   - You'll receive: `license.json` and `WATCHLLM_LICENSE_PUBLIC_KEY`

### Installation Steps

1. **Clone the repository** (or download the self-hosted package)
   ```bash
   cd watchllm/self-hosted
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your settings
   ```

   **Minimum required configuration:**
   ```env
   # Deployment mode
   WATCHLLM_MODE=self_hosted
   
   # Your LLM provider keys
   OPENAI_API_KEY=sk-xxx
   ANTHROPIC_API_KEY=sk-ant-xxx
   
   # License (provided by WatchLLM)
   WATCHLLM_LICENSE_PUBLIC_KEY=your-public-key-here
   
   # Security (generate with: openssl rand -hex 32)
   ENCRYPTION_KEY=$(openssl rand -hex 32)
   JWT_SECRET=$(openssl rand -hex 32)
   
   # Database passwords
   POSTGRES_PASSWORD=$(openssl rand -base64 32)
   CLICKHOUSE_PASSWORD=$(openssl rand -base64 32)
   ```

3. **Add license file**
   ```bash
   cp /path/to/your/license.json ./license.json
   ```

4. **Start services**
   ```bash
   docker-compose up -d
   ```

5. **Verify deployment**
   ```bash
   # Check all services are running
   docker-compose ps
   
   # Check health
   curl http://localhost:3000/api/health
   
   # View logs
   docker-compose logs -f watchllm
   ```

6. **Access the dashboard**
   - Open browser: http://localhost:3000
   - Create your first user account
   - Create a project and get your API key

### First API Call

Test the proxy endpoint:

```bash
# Using curl
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer wllm_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# Using OpenAI SDK (Python)
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="wllm_YOUR_API_KEY"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Hardware meets recommended specs
- [ ] Valid enterprise license obtained
- [ ] Domain name configured (e.g., `llm.yourcompany.com`)
- [ ] SSL/TLS certificates ready
- [ ] Firewall rules configured
- [ ] Backup strategy defined
- [ ] Monitoring tools integrated

### Production Configuration

Use the production Docker Compose override for production-ready settings:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Production `docker-compose.prod.yml` includes:**
- Resource limits (CPU/memory)
- Optimized logging (size limits, rotation)
- Security hardening (read-only filesystem, no-new-privileges)
- Performance tuning (PostgreSQL, Redis)

### Reverse Proxy Setup (NGINX)

**Recommended for production:** Use NGINX as a reverse proxy for SSL termination and load balancing.

Create `/etc/nginx/sites-available/watchllm`:

```nginx
upstream watchllm_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name llm.yourcompany.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name llm.yourcompany.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourcompany.crt;
    ssl_certificate_key /etc/ssl/private/yourcompany.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Increased timeout for long LLM requests
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    
    # Max body size for large prompts
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://watchllm_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint (for load balancers)
    location /health {
        proxy_pass http://watchllm_backend/api/health;
        access_log off;
    }
}
```

Enable and restart NGINX:
```bash
sudo ln -s /etc/nginx/sites-available/watchllm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### External Database Setup

For high availability, use managed database services:

#### PostgreSQL (AWS RDS example)

```env
# In .env
DATABASE_URL=postgresql://watchllm:YOUR_PASSWORD@your-db.us-east-1.rds.amazonaws.com:5432/watchllm
```

**Initial schema setup:**
```bash
psql $DATABASE_URL < self-hosted/init-db.sql
```

#### Redis (AWS ElastiCache example)

```env
# In .env
REDIS_URL=redis://your-cache.abc123.cache.amazonaws.com:6379
```

#### ClickHouse (Cloud or Self-Managed)

```env
# In .env
CLICKHOUSE_HOST=your-clickhouse.com
CLICKHOUSE_PORT=8443
CLICKHOUSE_USER=watchllm
CLICKHOUSE_PASSWORD=YOUR_PASSWORD
CLICKHOUSE_DATABASE=watchllm
CLICKHOUSE_SSL=true
```

**Initial schema setup:**
```bash
clickhouse-client --host your-clickhouse.com --port 9440 --secure \
  --user watchllm --password YOUR_PASSWORD \
  < self-hosted/clickhouse-init.sql
```

### High Availability Setup

For mission-critical deployments, run multiple WatchLLM instances behind a load balancer:

```yaml
# docker-compose.ha.yml
version: '3.8'

services:
  watchllm-1:
    <<: *watchllm-common  # Use YAML anchors
    container_name: watchllm-app-1
    
  watchllm-2:
    <<: *watchllm-common
    container_name: watchllm-app-2
    
  watchllm-3:
    <<: *watchllm-common
    container_name: watchllm-app-3
    
  nginx-lb:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - watchllm-1
      - watchllm-2
      - watchllm-3
```

---

## Configuration

### Environment Variables Reference

#### Core Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WATCHLLM_MODE` | ✅ | - | Must be `self_hosted` |
| `PORT` | ❌ | `3000` | Application port |
| `LOG_LEVEL` | ❌ | `info` | Logging level: `debug`, `info`, `warn`, `error` |

#### License Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WATCHLLM_LICENSE_PATH` | ⚠️ | `/etc/watchllm/license.json` | Path to license file |
| `WATCHLLM_LICENSE` | ⚠️ | - | License JSON (alternative to file) |
| `WATCHLLM_LICENSE_PUBLIC_KEY` | ✅ | - | License verification key |

**Note:** Provide either `WATCHLLM_LICENSE_PATH` or `WATCHLLM_LICENSE`.

#### LLM Provider Keys

Configure the providers you use:

| Variable | Provider | Format |
|----------|----------|--------|
| `OPENAI_API_KEY` | OpenAI | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic | `sk-ant-...` |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI | Custom |
| `GOOGLE_AI_API_KEY` | Google AI | Custom |
| `GROQ_API_KEY` | Groq | `gsk_...` |
| `OPENROUTER_API_KEY` | OpenRouter | `sk-or-...` |
| `COHERE_API_KEY` | Cohere | Custom |
| `TOGETHER_API_KEY` | Together AI | Custom |
| `MISTRAL_API_KEY` | Mistral AI | Custom |

#### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `REDIS_URL` | ✅ | - | Redis connection string |
| `CLICKHOUSE_HOST` | ❌ | `clickhouse` | ClickHouse hostname |
| `CLICKHOUSE_PORT` | ❌ | `8123` | ClickHouse HTTP port |
| `CLICKHOUSE_USER` | ❌ | `watchllm` | ClickHouse username |
| `CLICKHOUSE_PASSWORD` | ❌ | `watchllm` | ClickHouse password |
| `CLICKHOUSE_DATABASE` | ❌ | `watchllm` | ClickHouse database name |
| `CLICKHOUSE_SSL` | ❌ | `false` | Enable SSL for ClickHouse |

#### Caching Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_SIMILARITY_THRESHOLD` | `0.92` | Semantic similarity threshold (0.0-1.0). Higher = stricter matching |
| `CACHE_TTL_SECONDS` | `604800` | Cache TTL in seconds (default: 7 days) |

#### Security

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | ✅ | 32-byte hex key for encrypting sensitive data. Generate with: `openssl rand -hex 32` |
| `JWT_SECRET` | ✅ | JWT signing secret. Generate with: `openssl rand -hex 32` |

#### Optional: S3-Compatible Storage

For storing logs and backups in S3:

| Variable | Description |
|----------|-------------|
| `S3_ENDPOINT` | S3 endpoint URL |
| `S3_REGION` | AWS region |
| `S3_ACCESS_KEY` | Access key ID |
| `S3_SECRET_KEY` | Secret access key |
| `S3_BUCKET` | Bucket name |

### License Management

Your enterprise license controls features and usage limits.

**License file structure:**
```json
{
  "customer": "Your Company Name",
  "license_type": "enterprise",
  "issued_at": "2025-01-01",
  "expires_at": "2026-01-01",
  "features": [
    "self_hosted",
    "audit_logs",
    "advanced_analytics",
    "priority_support"
  ],
  "max_users": 100,
  "max_requests_per_month": 10000000,
  "signature": "..."
}
```

**Updating license:**
```bash
# Copy new license file
cp new-license.json ./license.json

# Restart WatchLLM
docker-compose restart watchllm

# Verify new license is active
docker-compose exec watchllm cat /etc/watchllm/license.json
```

**License validation:**
- Validated on startup (offline verification using public key)
- Re-validated every 24 hours
- Grace period of 7 days after expiration before enforcement

---

## Security & Compliance

### Data Privacy

**WatchLLM Self-Hosted guarantees:**
- ✅ **Zero telemetry**: No data sent to watchllm.dev
- ✅ **Full data ownership**: All prompts, responses, and logs stay in your infrastructure
- ✅ **Encryption at rest**: Sensitive data encrypted in PostgreSQL
- ✅ **Encryption in transit**: TLS for all external connections
- ✅ **Access control**: Role-based access control (RBAC) for users

### Compliance Support

WatchLLM Self-Hosted provides the **technical foundation** for compliance. Customers are responsible for their own certification.

| Framework | Self-Hosted Support |
|-----------|---------------------|
| **SOC 2** | Audit logs, encryption, access control |
| **HIPAA** | PHI data never leaves your VPC, encryption at rest/transit |
| **GDPR** | Data residency, right to deletion, audit trails |
| **ISO 27001** | Security controls, access logs, encryption |
| **FedRAMP** | Government-approved infrastructure possible with configuration |

### Security Best Practices

1. **Network Security**
   - Deploy in a private VPC/subnet
   - Use security groups to restrict database access
   - Expose only port 443 (HTTPS) publicly
   - Use Web Application Firewall (WAF) if available

2. **Authentication**
   - Enforce strong password policies
   - Enable multi-factor authentication (MFA) if integrating with SSO
   - Rotate API keys regularly
   - Use separate API keys per environment (dev/staging/prod)

3. **Secrets Management**
   - Use environment variables (never commit secrets to git)
   - Consider HashiCorp Vault or AWS Secrets Manager for production
   - Rotate `ENCRYPTION_KEY` and `JWT_SECRET` annually

4. **Monitoring**
   - Enable audit logs for all API key usage
   - Monitor for unusual traffic patterns
   - Set up alerts for failed authentication attempts
   - Log all administrative actions

5. **Updates & Patches**
   - Subscribe to WatchLLM security advisories
   - Apply security patches within 30 days
   - Test updates in staging environment first
   - Maintain rollback plan

### Audit Logs

WatchLLM logs all security-relevant events:

```sql
-- Query audit logs in PostgreSQL
SELECT * FROM audit_logs
WHERE event_type IN ('user_login', 'api_key_created', 'project_deleted')
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## Monitoring & Maintenance

### Health Checks

**Application health endpoint:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T12:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "clickhouse": "connected"
  },
  "license": {
    "valid": true,
    "expires_at": "2026-01-01"
  }
}
```

### Service Monitoring

**Check all service statuses:**
```bash
docker-compose ps
```

**Individual service health:**
```bash
# PostgreSQL
docker-compose exec postgres pg_isready -U watchllm

# Redis
docker-compose exec redis redis-cli ping

# ClickHouse
docker-compose exec clickhouse wget --spider -q http://localhost:8123/ping
```

### Log Management

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f watchllm

# Last 100 lines
docker-compose logs --tail=100 watchllm

# Follow with timestamp
docker-compose logs -f -t watchllm
```

**Log rotation** (handled automatically by Docker):
- Max size: 100MB per file
- Max files: 5
- Configured in `docker-compose.prod.yml`

### Performance Monitoring

**Key metrics to monitor:**

1. **Application Metrics**
   - Request latency (p50, p95, p99)
   - Request rate (requests/second)
   - Error rate (4xx, 5xx responses)
   - Cache hit rate

2. **Database Metrics** (PostgreSQL)
   - Connection pool utilization
   - Query latency
   - Disk I/O
   - Database size

3. **Cache Metrics** (Redis)
   - Memory usage
   - Cache hit/miss ratio
   - Eviction rate
   - Connection count

4. **Analytics Metrics** (ClickHouse)
   - Query performance
   - Disk usage
   - Insert rate
   - Merge operations

**Example: Query cache hit rate**
```sql
-- PostgreSQL
SELECT 
    COUNT(*) FILTER (WHERE cached = true) * 100.0 / COUNT(*) as cache_hit_rate_pct
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Example: Monitor resource usage**
```bash
# Container resource usage
docker stats watchllm-app watchllm-postgres watchllm-redis

# Disk usage
docker system df
```

### Prometheus Integration (Optional)

WatchLLM exposes Prometheus metrics at `/metrics`:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'watchllm'
    static_configs:
      - targets: ['localhost:3000']
```

**Key metrics exposed:**
- `watchllm_requests_total{method, status}`
- `watchllm_request_duration_seconds{quantile}`
- `watchllm_cache_hits_total`
- `watchllm_cache_misses_total`
- `watchllm_llm_tokens_total{provider, model}`
- `watchllm_llm_cost_usd_total{provider, model}`

### Scaling Recommendations

**When to scale:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU usage | > 70% sustained | Add CPU cores or scale horizontally |
| Memory usage | > 80% | Increase RAM or scale horizontally |
| Database connections | > 80% of max | Increase `max_connections` or add read replicas |
| Redis memory | > 80% | Increase `maxmemory` or deploy cluster |
| Disk I/O wait | > 20% | Upgrade to faster SSD or add caching |

---

## Backup & Disaster Recovery

### Backup Strategy

**1. PostgreSQL Backup**

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="watchllm_backup_${TIMESTAMP}.sql.gz"

docker-compose exec -T postgres pg_dump -U watchllm watchllm | gzip > "${BACKUP_DIR}/${FILENAME}"

# Keep only last 30 days
find ${BACKUP_DIR} -name "watchllm_backup_*.sql.gz" -mtime +30 -delete
```

**Automated via cron:**
```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * /path/to/backup-postgres.sh
```

**2. Redis Backup**

Redis automatically persists to disk (AOF enabled in docker-compose):
```bash
# Manual backup
docker-compose exec redis redis-cli BGSAVE

# Copy RDB file
docker cp watchllm-redis:/data/dump.rdb ./backups/redis/dump_$(date +%Y%m%d).rdb
```

**3. ClickHouse Backup**

```bash
# Backup ClickHouse data
docker-compose exec clickhouse clickhouse-client --query="BACKUP DATABASE watchllm TO Disk('backups', 'backup_$(date +%Y%m%d).zip')"
```

**4. Volume Backup**

```bash
# Backup Docker volumes
docker run --rm \
  -v watchllm_watchllm-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/watchllm-data_$(date +%Y%m%d).tar.gz -C /data .
```

### Restoration Procedures

**Restore PostgreSQL:**
```bash
# Stop application
docker-compose stop watchllm

# Restore database
gunzip < backup.sql.gz | docker-compose exec -T postgres psql -U watchllm watchllm

# Restart
docker-compose start watchllm
```

**Restore Redis:**
```bash
docker-compose stop redis
docker cp backup/dump.rdb watchllm-redis:/data/dump.rdb
docker-compose start redis
```

**Restore ClickHouse:**
```bash
docker-compose exec clickhouse clickhouse-client --query="RESTORE DATABASE watchllm FROM Disk('backups', 'backup_20250120.zip')"
```

### Disaster Recovery Plan

**RPO (Recovery Point Objective):** Maximum acceptable data loss  
**RTO (Recovery Time Objective):** Maximum acceptable downtime

**Recommended targets:**
- **RPO:** 24 hours (daily backups)
- **RTO:** 4 hours (restore from backup)

**DR Checklist:**
1. [ ] Backup all databases and volumes
2. [ ] Store backups in separate geographic location (S3, etc.)
3. [ ] Document restoration procedures
4. [ ] Test restoration quarterly
5. [ ] Maintain spare license file
6. [ ] Keep `.env` file in secure vault
7. [ ] Document all infrastructure as code

---

## Troubleshooting

### Common Issues

#### 1. Services Won't Start

**Symptom:** `docker-compose up` fails or services keep restarting

**Diagnosis:**
```bash
# Check logs
docker-compose logs watchllm postgres redis

# Check for port conflicts
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :6379
```

**Solutions:**
- Ensure ports 3000, 5432, 6379 are not in use
- Check `.env` file is properly configured
- Verify license file exists at `./license.json`
- Ensure sufficient disk space: `df -h`

#### 2. License Validation Fails

**Symptom:** Error: "Invalid or expired license"

**Diagnosis:**
```bash
# Check license file
cat ./license.json

# Check WatchLLM logs
docker-compose logs watchllm | grep -i license
```

**Solutions:**
- Verify `WATCHLLM_LICENSE_PUBLIC_KEY` matches your license
- Check license `expires_at` date
- Ensure license file is valid JSON
- Contact enterprise@watchllm.dev if license is valid but still fails

#### 3. Database Connection Errors

**Symptom:** "FATAL: database 'watchllm' does not exist" or connection timeouts

**Diagnosis:**
```bash
# Test database connectivity
docker-compose exec postgres psql -U watchllm -d watchllm -c "SELECT 1;"

# Check DATABASE_URL
docker-compose exec watchllm printenv DATABASE_URL
```

**Solutions:**
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running: `docker-compose ps postgres`
- Initialize database: `docker-compose exec -T postgres psql -U watchllm < init-db.sql`
- Check PostgreSQL logs: `docker-compose logs postgres`

#### 4. High Memory Usage

**Symptom:** Redis or ClickHouse consuming excessive memory

**Diagnosis:**
```bash
# Check memory usage
docker stats

# Redis memory
docker-compose exec redis redis-cli INFO memory
```

**Solutions:**
- **Redis:** Increase `maxmemory` or enable `allkeys-lru` eviction policy
- **ClickHouse:** Reduce `max_memory_usage` or increase `max_rows_to_group_by`
- Consider scaling to larger instance
- Clean old data: `DELETE FROM usage_logs WHERE created_at < NOW() - INTERVAL '90 days'`

#### 5. Slow Performance / High Latency

**Symptom:** API requests taking >5 seconds

**Diagnosis:**
```bash
# Check CPU/disk usage
docker stats

# Check database queries
docker-compose exec postgres psql -U watchllm -d watchllm -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check Redis
docker-compose exec redis redis-cli SLOWLOG GET 10
```

**Solutions:**
- Add database indexes (see `init-db.sql`)
- Increase Redis memory allocation
- Scale to more CPU cores
- Enable ClickHouse for heavy analytics queries
- Use external managed databases (RDS, ElastiCache)

#### 6. Cache Not Working

**Symptom:** Cache hit rate is 0%, all requests are cache misses

**Diagnosis:**
```bash
# Check cache hit rate
docker-compose exec postgres psql -U watchllm -d watchllm -c "
  SELECT 
    COUNT(*) FILTER (WHERE cached = true) as hits,
    COUNT(*) FILTER (WHERE cached = false) as misses
  FROM usage_logs
  WHERE created_at > NOW() - INTERVAL '1 hour';"

# Check Redis connectivity
docker-compose exec watchllm printenv REDIS_URL
docker-compose exec redis redis-cli PING
```

**Solutions:**
- Verify `REDIS_URL` is correct
- Check `CACHE_SIMILARITY_THRESHOLD` (default: 0.92)
- Lower threshold for more aggressive caching: `CACHE_SIMILARITY_THRESHOLD=0.85`
- Ensure prompts are similar enough for semantic matching

### Debug Mode

Enable detailed logging:

```env
# In .env
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

Restart services:
```bash
docker-compose restart watchllm
docker-compose logs -f watchllm
```

### Getting Support

**Self-Service Resources:**
- Documentation: https://docs.watchllm.dev
- GitHub Issues: https://github.com/watchllm/watchllm/issues
- Community Discord: https://discord.gg/watchllm

**Enterprise Support:**
- Email: enterprise@watchllm.dev
- Response SLA: 24 hours (business days)
- Priority support for production incidents

**When contacting support, include:**
1. WatchLLM version: `docker-compose exec watchllm cat /app/package.json | grep version`
2. Error logs: `docker-compose logs --tail=200 watchllm`
3. Environment: OS, Docker version, hardware specs
4. License type and customer name
5. Steps to reproduce the issue

---

## Upgrade Guide

### Minor Version Updates (e.g., 1.2.0 → 1.3.0)

```bash
# 1. Backup current data
./backup-all.sh

# 2. Pull new images
docker-compose pull

# 3. Restart services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Verify health
curl http://localhost:3000/api/health
```

### Major Version Updates (e.g., 1.x → 2.x)

**Always test in staging environment first!**

```bash
# 1. Read release notes for breaking changes
# 2. Backup all data
# 3. Review migration scripts in /migrations folder
# 4. Run migrations
docker-compose exec -T postgres psql -U watchllm < migrations/v2.0.0.sql

# 5. Update Docker images
docker-compose pull

# 6. Restart with new version
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 7. Verify and monitor
docker-compose logs -f watchllm
```

---

## Appendix

### A. Port Reference

| Service | Port | Protocol | External Access |
|---------|------|----------|-----------------|
| WatchLLM Dashboard | 3000 | HTTP | ✅ Yes (via HTTPS proxy) |
| PostgreSQL | 5432 | TCP | ❌ No (internal only) |
| Redis | 6379 | TCP | ❌ No (internal only) |
| ClickHouse HTTP | 8123 | HTTP | ❌ No (internal only) |
| ClickHouse Native | 9000 | TCP | ❌ No (internal only) |

### B. File Locations

| Path | Purpose |
|------|---------|
| `/etc/watchllm/license.json` | License file (mounted volume) |
| `/var/lib/watchllm/data` | Application data (mounted volume) |
| `/var/lib/watchllm/logs` | Request logs (mounted volume) |
| `/var/lib/postgresql/data` | PostgreSQL data (Docker volume) |
| `/data` (Redis container) | Redis persistence (Docker volume) |
| `/var/lib/clickhouse` | ClickHouse data (Docker volume) |

### C. Environment Variables Full Reference

See [Configuration](#configuration) section for complete list.

### D. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/v1/chat/completions` | POST | OpenAI-compatible chat endpoint |
| `/v1/completions` | POST | OpenAI-compatible completions |
| `/v1/embeddings` | POST | OpenAI-compatible embeddings |
| `/api/projects` | GET/POST | Project management |
| `/api/keys` | GET/POST | API key management |
| `/api/analytics` | GET | Usage analytics |
| `/metrics` | GET | Prometheus metrics |

### E. Sample docker-compose Override (Multi-Cloud)

For AWS ECS, GCP Cloud Run, Azure Container Instances:

```yaml
# docker-compose.cloud.yml
version: '3.8'

services:
  watchllm:
    environment:
      # Use managed services
      - DATABASE_URL=${RDS_DATABASE_URL}
      - REDIS_URL=${ELASTICACHE_URL}
      - CLICKHOUSE_HOST=${MANAGED_CLICKHOUSE_HOST}
      
      # Use secrets manager
      - OPENAI_API_KEY=${SECRET:openai-key}
      
      # Cloud storage
      - S3_BUCKET=watchllm-logs-${ENVIRONMENT}
      - S3_REGION=us-east-1
      
    # Remove internal database dependencies
    depends_on: []
```

---

## License & Support

**License:** WatchLLM Self-Hosted requires a valid enterprise license.  
**Support:** enterprise@watchllm.dev  
**Documentation:** https://docs.watchllm.dev  
**GitHub:** https://github.com/watchllm/watchllm

---

*Last updated: January 2026*  
*WatchLLM Self-Hosted Edition v1.0*
