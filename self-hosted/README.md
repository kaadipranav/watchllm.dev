# WatchLLM Self-Hosted Deployment Guide

Complete guide for deploying WatchLLM on your own infrastructure with full semantic caching, rate limiting, and analytics.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  WatchLLM Self-Hosted                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐      ┌──────────────────────┐    │
│  │   Dashboard     │      │  Standalone Worker   │    │
│  │   (Next.js)     │◄────►│  (Node.js + Hono)    │    │
│  │   Port 3000     │      │  Port 8080           │    │
│  │                 │      │                      │    │
│  │ - User UI       │      │ - API Proxy          │    │
│  │ - Analytics     │      │ - Semantic Cache     │    │
│  │ - Settings      │      │ - Rate Limiting      │    │
│  └────────┬────────┘      └──────────┬───────────┘    │
│           │                          │                │
│           │    ┌─────────────────────┼──────────┐    │
│           │    │                     │          │    │
│           ▼    ▼                     ▼          ▼    │
│      ┌──────────────┐        ┌──────────────────┐   │
│      │  PostgreSQL  │        │      Redis       │   │
│      │  Port 5432   │        │    Port 6379     │   │
│      │              │        │                  │   │
│      │ - Metadata   │        │ - Cache Storage  │   │
│      │ - API Keys   │        │ - Rate Limits    │   │
│      │ - Projects   │        │ - Session Data   │   │
│      └──────────────┘        └──────────────────┘   │
│                                                      │
│      ┌──────────────────────────────────────┐       │
│      │         ClickHouse (Optional)         │       │
│      │            Port 8123                  │       │
│      │                                       │       │
│      │ - High-volume analytics               │       │
│      │ - Request logs                        │       │
│      │ - Performance metrics                 │       │
│      └──────────────────────────────────────┘       │
│                                                      │
└──────────────────────────────────────────────────────┘

External Services:
  - OpenAI API (gpt-4, gpt-3.5-turbo, etc.)
  - Anthropic API (claude-3, etc.)
```

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 20GB disk space

### 1. Clone and Setup

```bash
git clone https://github.com/your-org/watchllm.git
cd watchllm/self-hosted
cp .env.example .env
```

### 2. Configure Environment

Edit `.env`:

```env
# Required: Your upstream API keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: ClickHouse (for high-volume analytics)
CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_DATABASE=watchllm
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Verify Installation

```bash
# Check all services are running
docker-compose ps

# Health check
curl http://localhost:8080/health
# {"status":"healthy","mode":"self_hosted"}

# Dashboard
open http://localhost:3000
```

**Done!** 🎉 Your proxy is now running at `http://localhost:8080/v1`

---

## 📋 Port Mappings

| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| **Dashboard** | 3000 | 3000 | Web UI for analytics & settings |
| **Worker** | 8080 | 8080 | API proxy endpoint (`/v1/*`) |
| **PostgreSQL** | 5432 | 5432 | Metadata & configuration |
| **Redis** | 6379 | 6379 | Cache & rate limiting |
| **ClickHouse** | 8123 | 8123 | Analytics (optional) |

### Changing Ports

Edit `docker-compose.yml`:

```yaml
services:
  watchllm-worker:
    ports:
      - "8081:8080"  # Change external port to 8081
```

---

## ⚙️ Configuration

### Environment Variables

#### Required

```env
# Upstream API Keys (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database (auto-configured in Docker)
DATABASE_URL=postgresql://watchllm:watchllm@postgres:5432/watchllm
REDIS_URL=redis://redis:6379
```

#### Optional

```env
# ClickHouse Analytics
CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_DATABASE=watchllm
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=

# Worker Configuration
WORKER_PORT=8080
NODE_ENV=production
LOG_LEVEL=info

# Supabase (if using external instance)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Network Configuration

All services communicate via Docker network `watchllm-network`. To expose to external network:

```yaml
# docker-compose.yml
services:
  watchllm-worker:
    ports:
      - "0.0.0.0:8080:8080"  # Bind to all interfaces
```

**⚠️ Security Warning:** Only expose externally if you have proper firewall rules!

---

## 🧪 Testing Your Deployment

### Quick Health Check

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "mode": "self_hosted",
  "services": {
    "database": "connected",
    "redis": "connected",
    "clickhouse": "connected"
  }
}
```

### Test API Request

```bash
# Create an API key in the dashboard first
# Then test with:

curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer lgw_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Run Test Suite

```bash
# Quick sanity check (30 seconds)
pnpm test:standalone:quick

# Full test suite (3-5 minutes)
pnpm test:standalone

# Load test (1 minute, 6000 requests)
pnpm test:standalone:load
```

---

## 🔧 Common Operations

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f watchllm-worker
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 watchllm-worker
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart worker only
docker-compose restart watchllm-worker

# Rebuild after code changes
docker-compose up -d --build watchllm-worker
```

### Database Operations

```bash
# Backup database
docker-compose exec postgres pg_dump -U watchllm watchllm > backup-$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T postgres psql -U watchllm watchllm < backup.sql

# Access psql shell
docker-compose exec postgres psql -U watchllm -d watchllm
```

### Redis Operations

```bash
# Access redis-cli
docker-compose exec redis redis-cli

# Check memory usage
docker-compose exec redis redis-cli INFO memory

# Flush cache (careful!)
docker-compose exec redis redis-cli FLUSHDB
```

---

## 🐛 Troubleshooting

### Worker Not Starting

**Symptom:** `docker-compose ps` shows worker as unhealthy

**Solutions:**

1. Check logs:
   ```bash
   docker-compose logs watchllm-worker
   ```

2. Verify database connection:
   ```bash
   docker-compose exec watchllm-worker node -e "
   const { Pool } = require('pg');
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   pool.query('SELECT 1').then(() => console.log('DB OK')).catch(console.error);
   "
   ```

3. Check environment variables:
   ```bash
   docker-compose exec watchllm-worker env | grep -E '(DATABASE|REDIS|OPENAI)'
   ```

### Connection Refused Errors

**Symptom:** Cannot reach `http://localhost:8080`

**Solutions:**

1. Verify ports are exposed:
   ```bash
   docker-compose ps
   netstat -an | grep 8080
   ```

2. Check firewall rules:
   ```bash
   # Linux
   sudo ufw status
   
   # macOS
   sudo pfctl -s rules
   ```

3. Test from inside container:
   ```bash
   docker-compose exec watchllm-worker curl http://localhost:8080/health
   ```

### High Memory Usage

**Symptom:** Redis or PostgreSQL using too much memory

**Solutions:**

1. Limit Redis memory in `docker-compose.yml`:
   ```yaml
   redis:
     command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
   ```

2. Tune PostgreSQL connections:
   ```yaml
   postgres:
     environment:
       POSTGRES_INITDB_ARGS: "-c max_connections=50"
   ```

### Slow Response Times

**Symptom:** API requests taking >2 seconds

**Solutions:**

1. Check cache hit rate:
   ```bash
   curl http://localhost:8080/v1/chat/completions \
     -H "Authorization: Bearer lgw_xxx" \
     ... 
   # Look for x-watchllm-cache: hit/miss header
   ```

2. Monitor Redis latency:
   ```bash
   docker-compose exec redis redis-cli --latency
   ```

3. Check database query performance:
   ```bash
   docker-compose exec postgres psql -U watchllm -d watchllm -c "
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   "
   ```

---

## 🚀 Performance Tuning

### For Low-Volume (<1K req/day)

Default settings work fine. No tuning needed.

### For Medium-Volume (1K-100K req/day)

#### Increase Connection Pools

Edit `worker/standalone.ts`:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Increase from 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Redis Memory Optimization

```yaml
# docker-compose.yml
redis:
  command: redis-server --maxmemory 4gb --maxmemory-policy allkeys-lru
```

### For High-Volume (>100K req/day)

#### Enable ClickHouse

Offload analytics to ClickHouse for better performance:

```env
CLICKHOUSE_HOST=http://clickhouse:8123
CLICKHOUSE_DATABASE=watchllm
```

#### Horizontal Scaling

Run multiple worker instances:

```yaml
# docker-compose.yml
watchllm-worker:
  deploy:
    replicas: 3
```

Then add load balancer (nginx, HAProxy, etc.).

#### Database Read Replicas

For PostgreSQL:

```yaml
postgres-replica:
  image: postgres:16
  environment:
    POSTGRES_PRIMARY_HOST: postgres
```

---

## 🔒 Security Hardening

### 1. Change Default Passwords

```env
# .env
POSTGRES_PASSWORD=your-strong-password-here
REDIS_PASSWORD=your-redis-password-here
```

### 2. Enable SSL/TLS

Use a reverse proxy (nginx, Caddy, Traefik):

```nginx
# nginx.conf
server {
  listen 443 ssl;
  server_name watchllm.yourdomain.com;
  
  ssl_certificate /etc/ssl/certs/watchllm.crt;
  ssl_certificate_key /etc/ssl/private/watchllm.key;
  
  location / {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### 3. Network Isolation

Don't expose database ports externally:

```yaml
# docker-compose.yml
postgres:
  ports: []  # Remove external port mapping
```

### 4. API Key Rotation

Regularly rotate API keys:

```bash
# In dashboard: Settings → API Keys → Rotate
```

### 5. Rate Limiting

Configure aggressive rate limits:

```typescript
// worker/src/lib/rate-limiting.ts
export const RATE_LIMITS = {
  FREE: { requests: 1000, window: 86400 },    // 1K/day
  STARTER: { requests: 10000, window: 86400 }, // 10K/day
  PRO: { requests: 100000, window: 86400 },    // 100K/day
};
```

### 6. Firewall Rules

```bash
# Allow only necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 5432/tcp  # Block PostgreSQL from internet
ufw deny 6379/tcp  # Block Redis from internet
```

---

## 📊 Monitoring

### Health Checks

```bash
# Worker health
curl http://localhost:8080/health

# Database health
docker-compose exec postgres pg_isready -U watchllm

# Redis health
docker-compose exec redis redis-cli ping
```

### Metrics

Available at `/metrics` endpoint:

```bash
curl http://localhost:8080/metrics
```

**Example output:**
```
watchllm_requests_total{status="200"} 1234
watchllm_cache_hits_total 567
watchllm_cache_misses_total 667
watchllm_latency_seconds_bucket{le="0.1"} 890
```

### Log Aggregation

Forward logs to external service:

```yaml
# docker-compose.yml
services:
  watchllm-worker:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🔄 Backup & Recovery

### Automated Backups

Create a cron job:

```bash
#!/bin/bash
# /etc/cron.daily/watchllm-backup

cd /path/to/watchllm/self-hosted
docker-compose exec -T postgres pg_dump -U watchllm watchllm | gzip > /backups/watchllm-$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
find /backups -name "watchllm-*.sql.gz" -mtime +30 -delete
```

### Disaster Recovery

```bash
# Stop services
docker-compose down

# Restore database
gunzip < backup.sql.gz | docker-compose exec -T postgres psql -U watchllm watchllm

# Restart
docker-compose up -d
```

---

## 📦 Updating

### Minor Updates

```bash
cd watchllm/self-hosted
git pull origin main
docker-compose up -d --build
```

### Major Updates

1. Backup data
2. Read `CHANGELOG.md` for breaking changes
3. Update `.env` if needed
4. Run migrations:
   ```bash
   docker-compose exec watchllm-worker npm run migrate
   ```
5. Restart services

---

## 🆘 Support

- **Documentation:** [docs.watchllm.dev](https://docs.watchllm.dev)
- **Issues:** [github.com/watchllm/watchllm/issues](https://github.com/watchllm/watchllm/issues)
- **Email:** support@watchllm.dev
- **Enterprise:** enterprise@watchllm.dev

---

## 📄 License

Self-hosted deployment is available under commercial license.
Contact sales@watchllm.dev for enterprise licensing.
