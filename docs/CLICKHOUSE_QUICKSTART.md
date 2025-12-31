# ClickHouse Quick Start - Task 1.1

## 🚀 Quick Setup (5 minutes)

### 1. Create DigitalOcean Droplet

```bash
# Go to: https://marketplace.digitalocean.com/apps/clickhouse
# Click "Create ClickHouse Droplet"
# Select: Basic Plan ($12/month - 2GB RAM)
# Region: Bangalore (or closest to you)
# Add SSH key
# Create!
```

### 2. SSH into Server

```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Configure Remote Access

```bash
# Edit config
nano /etc/clickhouse-server/config.xml

# Find and uncomment this line (around line 60):
# <listen_host>0.0.0.0</listen_host>

# Save: Ctrl+X, Y, Enter

# Restart service
systemctl restart clickhouse-server
```

### 4. Create Database & User

```bash
# Connect to ClickHouse
clickhouse-client

# Run these SQL commands:
CREATE DATABASE watchllm;
CREATE USER watchllm_user IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL ON watchllm.* TO watchllm_user;
EXIT;
```

### 5. Configure Firewall

```bash
ufw allow 8123/tcp
ufw enable
```

### 6. Test Connection

```bash
# From your local machine (replace YOUR_DROPLET_IP):
curl http://YOUR_DROPLET_IP:8123/
# Expected: Ok.
```

## 📝 Update Environment Variables

### Worker: `worker/.dev.vars`

```env
CLICKHOUSE_HOST=YOUR_DROPLET_IP
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=watchllm_user
CLICKHOUSE_PASSWORD=YourStrongPassword123!
CLICKHOUSE_DATABASE=watchllm
CLICKHOUSE_SSL=false
```

### Dashboard: `dashboard/.env.local`

```env
CLICKHOUSE_HOST=YOUR_DROPLET_IP
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=watchllm_user
CLICKHOUSE_PASSWORD=YourStrongPassword123!
CLICKHOUSE_DATABASE=watchllm
CLICKHOUSE_SSL=false
```

## ✅ Verify Setup

```bash
node scripts/verify-clickhouse.js
```

Expected output:
```
🔍 Verifying ClickHouse Connection...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Configuration:
   Host:     YOUR_DROPLET_IP
   Port:     8123
   User:     watchllm_user
   Password: ********
   Database: watchllm
   SSL:      Disabled

🔌 Attempting connection...
   ✅ Ping successful
   ✅ Version: 24.x.x.x
   ✅ Database 'watchllm' exists
   ℹ️  No tables found (expected for fresh setup)

🧪 Running read/write test...
   ✅ Write test successful
   ✅ Read test successful
   ✅ Cleanup successful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All checks passed! ClickHouse is ready for WatchLLM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🎯 Task 1.1 Complete!

You can now proceed to **Task 1.2: ClickHouse Schema Design**

## 💡 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't SSH | Check SSH key in DigitalOcean dashboard |
| Connection timeout | Verify firewall: `ufw status` |
| Permission denied | Check user/password in `.dev.vars` |
| Database not found | Run `CREATE DATABASE watchllm;` in clickhouse-client |

## 📚 Full Documentation

See `docs/CLICKHOUSE_SETUP.md` for detailed setup instructions and security best practices.
