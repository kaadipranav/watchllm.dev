# ClickHouse Setup Guide - DigitalOcean

This guide walks you through setting up ClickHouse on DigitalOcean using your **$200 Student Pack credit**.

## Prerequisites

- DigitalOcean account with Student Pack activated
- SSH key configured in DigitalOcean
- Terminal access (PowerShell/CMD on Windows)

## Option 1: One-Click ClickHouse Droplet (Recommended)

### Step 1: Create Droplet

1. Go to [DigitalOcean Marketplace - ClickHouse](https://marketplace.digitalocean.com/apps/clickhouse)
2. Click **"Create ClickHouse Droplet"**
3. Choose configuration:
   - **Plan**: Basic ($12/month - 2GB RAM, 1 vCPU, 50GB SSD)
   - **Datacenter**: Choose closest to your users (e.g., Bangalore for India)
   - **Authentication**: Add your SSH key
   - **Hostname**: `watchllm-clickhouse`
4. Click **"Create Droplet"**

### Step 2: Initial Configuration

Once the droplet is created (takes ~60 seconds):

1. Note the **IP address** (e.g., `143.198.xxx.xxx`)
2. SSH into the server:
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```

3. The ClickHouse service should be running. Verify:
   ```bash
   systemctl status clickhouse-server
   ```

### Step 3: Configure ClickHouse for Remote Access

By default, ClickHouse only listens on localhost. We need to enable remote access:

1. Edit the configuration:
   ```bash
   nano /etc/clickhouse-server/config.xml
   ```

2. Find the `<listen_host>` section and uncomment/add:
   ```xml
   <listen_host>0.0.0.0</listen_host>
   ```

3. Restart ClickHouse:
   ```bash
   systemctl restart clickhouse-server
   ```

### Step 4: Create Database and User

1. Connect to ClickHouse client:
   ```bash
   clickhouse-client
   ```

2. Create database:
   ```sql
   CREATE DATABASE watchllm;
   ```

3. Create a dedicated user (replace `YOUR_STRONG_PASSWORD`):
   ```sql
   CREATE USER watchllm_user IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
   GRANT ALL ON watchllm.* TO watchllm_user;
   ```

4. Exit the client:
   ```sql
   EXIT;
   ```

### Step 5: Configure Firewall

Allow ClickHouse ports through the firewall:

```bash
# Allow HTTP interface (port 8123)
ufw allow 8123/tcp

# Allow native protocol (port 9000) - optional
ufw allow 9000/tcp

# Enable firewall if not already enabled
ufw enable
```

### Step 6: Test Connection

From your local machine, test the HTTP interface:

```bash
curl http://YOUR_DROPLET_IP:8123/
```

Expected output: `Ok.`

## Option 2: Manual Installation (Alternative)

If you prefer manual installation:

1. Create a basic Ubuntu 22.04 droplet
2. SSH into the server
3. Install ClickHouse:
   ```bash
   sudo apt-get update
   sudo apt-get install -y apt-transport-https ca-certificates dirmngr
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 8919F6BD2B48D754
   echo "deb https://packages.clickhouse.com/deb stable main" | sudo tee /etc/apt/sources.list.d/clickhouse.list
   sudo apt-get update
   sudo apt-get install -y clickhouse-server clickhouse-client
   ```

4. Start the service:
   ```bash
   sudo systemctl start clickhouse-server
   sudo systemctl enable clickhouse-server
   ```

5. Follow Steps 3-6 from Option 1 above.

## Security Best Practices

1. **Use strong passwords** for the database user
2. **Enable SSL/TLS** for production (use Let's Encrypt)
3. **Restrict IP access** via DigitalOcean firewall to only your Worker IPs
4. **Regular backups** - DigitalOcean offers automated backups for $2.40/month

## Connection Details for WatchLLM

After setup, you'll have:

- **Host**: `YOUR_DROPLET_IP` or domain if you set up DNS
- **Port**: `8123` (HTTP) or `9000` (Native)
- **Database**: `watchllm`
- **User**: `watchllm_user`
- **Password**: `YOUR_STRONG_PASSWORD`

These will be added to `.dev.vars` and `.env.local` in the next step.

## Cost Estimate

- **Basic Droplet**: $12/month (2GB RAM)
- **With your $200 credit**: ~16 months free
- **Recommended**: Start with Basic, upgrade to $24/month (4GB RAM) when you hit 1M+ events/day

## Troubleshooting

### Can't connect remotely
- Check firewall: `ufw status`
- Verify ClickHouse is listening: `netstat -tulpn | grep clickhouse`
- Check config: `cat /etc/clickhouse-server/config.xml | grep listen_host`

### Service won't start
- Check logs: `journalctl -u clickhouse-server -n 50`
- Verify disk space: `df -h`

### Performance issues
- Monitor with: `clickhouse-client --query "SELECT * FROM system.metrics"`
- Check memory: `free -h`

## Next Steps

Once ClickHouse is running:
1. Add credentials to `.dev.vars` and `.env.local`
2. Run `node scripts/verify-clickhouse.js` to verify connection
3. Proceed to Task 1.2: Schema Design
