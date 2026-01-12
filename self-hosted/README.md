# WatchLLM Self-Hosted - Quick Reference Card

## Quick Start Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart after config change
docker-compose restart watchllm

# Check status
docker-compose ps
curl http://localhost:3000/api/health
```

## Essential Environment Variables

```env
# Required
WATCHLLM_MODE=self_hosted
OPENAI_API_KEY=sk-xxx
WATCHLLM_LICENSE_PUBLIC_KEY=your-key

# Database (auto-configured with docker-compose)
DATABASE_URL=postgresql://watchllm:watchllm@postgres:5432/watchllm
REDIS_URL=redis://redis:6379
```

## File Locations

| Path | Purpose |
|------|---------|
| `/etc/watchllm/license.json` | License file |
| `/var/lib/watchllm/data` | Application data |
| `/var/lib/watchllm/logs` | Request logs |
| `./docker-compose.yml` | Service definitions |
| `./.env` | Environment configuration |

## License Commands

```bash
# Check license status
docker-compose exec watchllm cat /etc/watchllm/license.json

# Update license
cp new-license.json ./license.json
docker-compose restart watchllm
```

## Backup Commands

```bash
# Backup database
docker-compose exec postgres pg_dump -U watchllm watchllm > backup-$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T postgres psql -U watchllm watchllm < backup.sql
```

## Ports

| Service | Port | Purpose |
|---------|------|---------|
| WatchLLM | 3000 | Dashboard & API |
| PostgreSQL | 5432 | Metadata storage |
| Redis | 6379 | Caching |
| ClickHouse | 8123 | Analytics (optional) |

## Support

Enterprise support: **enterprise@watchllm.dev**
