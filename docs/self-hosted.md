# WatchLLM Self-Hosted Deployment Guide

Deploy WatchLLM entirely inside your own infrastructure with full data isolation.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        YOUR INFRASTRUCTURE                                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     WatchLLM Self-Hosted                              │   │
│  │                                                                       │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │   │
│  │   │  Dashboard  │    │   Proxy     │    │     LLM Providers       │  │   │
│  │   │  (Next.js)  │◄──►│   (API)     │◄──►│  (OpenAI, Anthropic,    │  │   │
│  │   │   :3000     │    │   :8080     │    │   Azure, etc.)          │  │   │
│  │   └─────────────┘    └─────────────┘    └─────────────────────────┘  │   │
│  │          │                  │                                         │   │
│  │          ▼                  ▼                                         │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │   │
│  │   │ PostgreSQL  │    │    Redis    │    │  ClickHouse (optional)  │  │   │
│  │   │  Metadata   │    │   Caching   │    │      Analytics          │  │   │
│  │   └─────────────┘    └─────────────┘    └─────────────────────────┘  │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Persistent Storage                                                   │   │
│  │  • /var/lib/watchllm/data  - Application data                        │   │
│  │  • /var/lib/watchllm/logs  - Request logs                            │   │
│  │  • /etc/watchllm/          - License & configuration                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

           ╳ NO outbound traffic to watchllm.dev
           ✓ Only outbound: Your configured LLM providers
```

---

## Data Isolation Statement

> **WatchLLM does not receive, store, or process customer data in self-hosted mode.**
>
> When deployed in self-hosted mode:
> - All API requests stay within your infrastructure
> - All logs, prompts, and responses are stored locally
> - No telemetry or analytics are sent externally
> - No authentication against watchllm.dev
> - License validation is completely offline

---

## Quick Start

### Prerequisites

- Docker & Docker Compose v2.0+
- 4GB RAM minimum (8GB recommended)
- 20GB disk space
- Valid enterprise license file

### 1. Clone or Download

```bash
# If you have access to the repository
git clone https://github.com/watchllm/watchllm.git
cd watchllm/self-hosted

# Or download the self-hosted package
curl -L https://releases.watchllm.dev/self-hosted/latest.tar.gz | tar xz
cd watchllm-self-hosted
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your settings
nano .env  # or use your preferred editor
```

**Required settings:**
```env
# Deployment mode (required)
WATCHLLM_MODE=self_hosted

# At least one LLM provider key
OPENAI_API_KEY=sk-xxx
# Or
ANTHROPIC_API_KEY=sk-ant-xxx
```

### 3. Install License

Place your license file:
```bash
# Copy your license file
cp /path/to/your/license.json ./license.json
```

Or set via environment variable:
```bash
export WATCHLLM_LICENSE='{"customer":"...","signature":"..."}'
```

### 4. Start Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f watchllm
```

### 5. Access Dashboard

Open http://localhost:3000 in your browser.

Default credentials:
- Email: `admin@localhost`
- Password: Set on first login

---

## Environment Variables

### Core Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WATCHLLM_MODE` | Yes | `saas` | Set to `self_hosted` |
| `PORT` | No | `3000` | Dashboard port |
| `LOG_LEVEL` | No | `info` | Logging level |

### License Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `WATCHLLM_LICENSE_PATH` | No | Path to license file (default: `/etc/watchllm/license.json`) |
| `WATCHLLM_LICENSE` | No | License JSON directly (alternative to file) |
| `WATCHLLM_LICENSE_PUBLIC_KEY` | Yes | Public key for license verification |

### LLM Providers

Configure the providers you use:

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI (GPT-4, GPT-3.5) |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint |
| `GOOGLE_AI_API_KEY` | Google AI (Gemini) |
| `GROQ_API_KEY` | Groq |
| `OPENROUTER_API_KEY` | OpenRouter |
| `MISTRAL_API_KEY` | Mistral AI |
| `COHERE_API_KEY` | Cohere |
| `TOGETHER_API_KEY` | Together AI |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | Yes | - | Redis connection string |
| `CLICKHOUSE_HOST` | No | - | ClickHouse host (for analytics) |

### Security

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | Yes | 32-byte hex key for encrypting sensitive data |
| `JWT_SECRET` | Yes | Secret for JWT tokens |

---

## License Management

### License File Format

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
  "signature": "<provided_signature>"
}
```

### License Types

| Type | Features |
|------|----------|
| `trial` | 30-day evaluation, all features |
| `standard` | Core self-hosted features |
| `enterprise` | All features + priority support |

### License Status

Check license status:
```bash
docker-compose exec watchllm node -e "
  const { getLicenseManager } = require('@watchllm/shared');
  const mgr = getLicenseManager();
  console.log(mgr.getDisplayInfo());
"
```

### Grace Period

If your license expires:
- 30-day grace period with full functionality
- Warning banners appear in dashboard
- After grace period: Read-only mode
- **No hard shutdown** - existing integrations continue working

### Renewing License

1. Contact enterprise@watchllm.dev for renewal
2. Receive new license file
3. Replace `license.json`
4. Restart services: `docker-compose restart watchllm`

---

## Data Flow

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────┐
│ Your App    │────►│ WatchLLM Proxy  │────►│ LLM Provider  │
│             │     │ (localhost)     │     │ (api.openai..) │
└─────────────┘     └─────────────────┘     └───────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Local Storage Only     │
              │ • PostgreSQL           │
              │ • Redis Cache          │
              │ • ClickHouse Analytics │
              │ • File System Logs     │
              └────────────────────────┘
```

**What DOES leave your network:**
- API requests to your configured LLM providers (OpenAI, Anthropic, etc.)

**What NEVER leaves your network:**
- Prompts and responses (stored locally only)
- Usage metrics and analytics
- User data and API keys
- Any telemetry data

---

## Production Deployment

### Cloud Deployment (AWS/GCP/Azure)

1. **Provision infrastructure:**
   - VM or container service (ECS, Cloud Run, AKS)
   - Managed PostgreSQL (RDS, Cloud SQL, Azure Database)
   - Managed Redis (ElastiCache, Memorystore, Azure Cache)
   - Optional: Managed ClickHouse (ClickHouse Cloud)

2. **Security best practices:**
   ```bash
   # Generate strong encryption key
   openssl rand -hex 32
   
   # Generate JWT secret
   openssl rand -hex 32
   ```

3. **Use production compose file:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### On-Premises / Private VPC

1. **Network requirements:**
   - Allow outbound HTTPS to LLM providers
   - Internal access to database services
   - No inbound access required

2. **Firewall rules:**
   ```
   # Outbound (required)
   Allow TCP 443 to api.openai.com
   Allow TCP 443 to api.anthropic.com
   # Add other providers as needed
   
   # Inbound (optional - for dashboard access)
   Allow TCP 3000 from internal network
   ```

### High Availability

For production HA deployments:

```yaml
# docker-compose.ha.yml
services:
  watchllm:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

---

## Upgrading

### Standard Upgrade

```bash
# Pull latest images
docker-compose pull

# Restart with new version
docker-compose up -d

# Run migrations (if any)
docker-compose exec watchllm npm run migrate
```

### Backup Before Upgrade

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U watchllm watchllm > backup.sql

# Backup volumes
docker run --rm -v watchllm-data:/data -v $(pwd):/backup alpine \
    tar czf /backup/watchllm-data-backup.tar.gz /data
```

### Rollback

```bash
# Restore from backup
docker-compose exec -T postgres psql -U watchllm watchllm < backup.sql

# Or restore volume
docker run --rm -v watchllm-data:/data -v $(pwd):/backup alpine \
    tar xzf /backup/watchllm-data-backup.tar.gz -C /
```

---

## Troubleshooting

### Check Service Status

```bash
# View all containers
docker-compose ps

# Check logs
docker-compose logs watchllm
docker-compose logs postgres
docker-compose logs redis

# Check health
curl http://localhost:3000/api/health
```

### Common Issues

**License not found:**
```bash
# Verify license file exists
ls -la ./license.json

# Check file is mounted
docker-compose exec watchllm cat /etc/watchllm/license.json
```

**Database connection failed:**
```bash
# Test PostgreSQL connection
docker-compose exec watchllm pg_isready -h postgres -U watchllm

# Check logs
docker-compose logs postgres
```

**Redis connection failed:**
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Reset Installation

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## Support

- **Documentation:** https://docs.watchllm.dev/self-hosted
- **Enterprise Support:** enterprise@watchllm.dev
- **License Renewals:** enterprise@watchllm.dev

---

## Legal Notice

WatchLLM self-hosted deployments:
- Are covered under your enterprise license agreement
- Include no warranty for specific compliance frameworks
- Do not include automatic security patches (upgrade manually)

**WatchLLM does not claim compliance certifications; self-hosting enables customers to meet their own regulatory requirements.**

For compliance requirements (HIPAA, SOC2, etc.), please consult with your security team regarding your specific deployment configuration.
