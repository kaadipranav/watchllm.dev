# ClickHouse Setup Guide - DigitalOcean

This guide walks you through setting up ClickHouse on DigitalOcean using your **$200 Student Pack credit**.

## What is ClickHouse and Why Do You Need It?

**ClickHouse** is a fast, open-source database designed for analytics and real-time queries. For WatchLLM, it:

- **Stores usage analytics**: Tracks API calls, costs, and performance metrics
- **Powers dashboards**: Enables real-time charts and reports
- **Handles high volume**: Can process millions of events efficiently
- **Provides insights**: Helps you understand usage patterns and optimize costs

**Why DigitalOcean?** It's reliable, has a one-click ClickHouse setup, and your $200 student credit covers ~16 months of usage.

## Quick Overview (What You'll Do)

1. **Set up SSH key** (5 minutes) - Secure connection to your server
2. **Create ClickHouse droplet** (2 minutes) - One-click deployment on DigitalOcean
3. **Configure remote access** (5 minutes) - Allow internet connections
4. **Create database & user** (3 minutes) - Set up WatchLLM's data storage
5. **Configure firewall** (2 minutes) - Secure server access
6. **Test connection** (1 minute) - Verify everything works
7. **Update WatchLLM config** (2 minutes) - Connect your app to the database

**Total time: ~20 minutes** | **Cost: $32/month** (covered by student credit for ~6 months)

## Prerequisites

- DigitalOcean account with Student Pack activated
- SSH key configured in DigitalOcean (see Step 1 below if you haven't done this)
- Terminal access (PowerShell/CMD on Windows, or Terminal on Mac/Linux)

## Step 0: Set Up SSH Key (If Not Done)

### Windows (PowerShell)
```powershell
# Generate SSH key (use your personal email or support@watchllm.dev)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to clipboard
Get-Content ~/.ssh/id_rsa.pub | Set-Clipboard
```

### Mac/Linux (Terminal)
```bash
# Generate SSH key (use your personal email or support@watchllm.dev)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to clipboard
pbcopy < ~/.ssh/id_rsa.pub  # Mac
xclip -sel clip < ~/.ssh/id_rsa.pub  # Linux
```

Then:
1. Go to [DigitalOcean SSH Keys](https://cloud.digitalocean.com/account/security)
2. Click "Add SSH Key"
3. Paste your public key and give it a name

## Option 1: One-Click ClickHouse Droplet (Recommended)

## Option 1: One-Click ClickHouse Droplet (Recommended)

### Step 1: Create Droplet

1. Go to [DigitalOcean Marketplace - ClickHouse](https://marketplace.digitalocean.com/apps/clickhouse)
2. Click **"Create ClickHouse Droplet"**
3. Choose configuration:
   - **Plan**: Basic ($32/month - 1GB RAM, 1 vCPU, 25GB SSD) - sufficient for WatchLLM
   - **Datacenter**: Choose closest to your users (e.g., Bangalore for India)
   - **Authentication**: Add your SSH key
   - **Hostname**: `watchllm-clickhouse`
4. Click **"Create Droplet"**

### Step 2: Initial Configuration

Once the droplet is created (takes ~60 seconds):

1. Note the **IP address** from your DigitalOcean dashboard (e.g., `143.198.xxx.xxx`)
2. SSH into the server:
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```
   > **What this does**: Connects you to your server securely

3. The ClickHouse service should be running. Verify:
   ```bash
   systemctl status clickhouse-server
   ```
   > **Expected output**: Shows "active (running)" in green

### Step 3: Configure ClickHouse for Remote Access

By default, ClickHouse only accepts connections from the same server. We need to allow connections from the internet:

1. Edit the configuration:
   ```bash
   nano /etc/clickhouse-server/config.xml
   ```
   > **What this does**: Opens a text editor to modify ClickHouse settings

2. Find the `<listen_host>` section (around line 60) and uncomment/add:
   ```xml
   <listen_host>0.0.0.0</listen_host>
   ```
   > **What this means**: Allows connections from any IP address (we'll secure this later)

3. Save and exit: `Ctrl+X`, then `Y`, then `Enter`

4. Restart ClickHouse:
   ```bash
   systemctl restart clickhouse-server
   ```
   > **What this does**: Applies the new configuration

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

> If you get an error like:
> `Not enough privileges. To execute this query, it's necessary to have the grant CREATE USER ON *.* (ACCESS_DENIED)`
> you need to enable ClickHouse access management for the `default` user.
>
> **Fix (run on the server):**
> ```bash
> # Enable RBAC/admin operations for the default user
> sudo sed -i 's/<!--[[:space:]]*<access_management>1<\/access_management>[[:space:]]*-->/<access_management>1<\/access_management>/' /etc/clickhouse-server/users.xml
>
> # Restart ClickHouse to apply changes
> sudo systemctl restart clickhouse-server
> ```
> Then run the `CREATE USER` / `GRANT` commands again.

1. Connect to ClickHouse client:
   ```bash
   clickhouse-client
   ```
   > **What this does**: Opens ClickHouse's command-line interface

2. Create database:
   ```sql
   CREATE DATABASE watchllm;
   ```
   > **What this does**: Creates a database named "watchllm" to store your data

3. Create a dedicated user (replace `YOUR_STRONG_PASSWORD` with a secure password):
   ```sql
   CREATE USER watchllm_user IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
   GRANT ALL ON watchllm.* TO watchllm_user;
   ```
   > **What this does**: Creates a user account with full access to the watchllm database

4. Exit the client:
   ```sql
   EXIT;
   ```

### Step 5: Configure Firewall

Allow ClickHouse ports through the firewall:

```bash
# Allow HTTP interface (port 8123) - main connection port
ufw allow 8123/tcp

# Allow native protocol (port 9000) - optional, for advanced tools
ufw allow 9000/tcp

# Enable firewall if not already enabled
ufw enable
```
> **What this does**: Opens specific ports in the server's firewall so WatchLLM can connect to ClickHouse

### Step 6: Test Connection

From your local machine, test the HTTP interface:

```bash
curl http://YOUR_DROPLET_IP:8123/
```

Expected output: `Ok.`

> **What this does**: Tests that ClickHouse is accessible from the internet

## Step 7: Configure WatchLLM Environment Variables

After successful setup, you need to add the connection details to WatchLLM:

### For the Worker (.dev.vars file):
1. Open `worker/.dev.vars` in your code editor
2. Update these lines with your actual values:
   ```bash
   CLICKHOUSE_HOST=YOUR_DROPLET_IP
   CLICKHOUSE_PORT=8123
   CLICKHOUSE_USER=watchllm_user
   CLICKHOUSE_PASSWORD=YOUR_STRONG_PASSWORD
   CLICKHOUSE_DATABASE=watchllm
   CLICKHOUSE_SSL=false
   ```

### For the Dashboard (.env.local file):
1. Open `dashboard/.env.local` in your code editor
2. Update these lines with your actual values:
   ```bash
   CLICKHOUSE_HOST=YOUR_DROPLET_IP
   CLICKHOUSE_PORT=8123
   CLICKHOUSE_USER=watchllm_user
   CLICKHOUSE_PASSWORD=YOUR_STRONG_PASSWORD
   CLICKHOUSE_DATABASE=watchllm
   CLICKHOUSE_SSL=false
   ```

## Step 8: Verify WatchLLM Connection

Test that WatchLLM can connect to your ClickHouse instance:

```bash
# From the project root directory
node scripts/verify-clickhouse.js
```

Expected output:
```
✅ Successfully connected to ClickHouse! Version: 24.x.x.x
✅ Database 'watchllm' exists
✅ User 'watchllm_user' has access
```

> **What this does**: Runs an automated test to ensure everything is configured correctly

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

- **Basic Droplet**: $32/month (1GB RAM, 1 vCPU, 25GB SSD)
- **With your $200 credit**: ~6 months free
- **Recommended**: Start with Basic, upgrade to $48/month (2GB RAM) when you hit 1M+ events/day

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

## Next Steps After Setup

Once ClickHouse is running and connected:

1. **Create the database schema**:
   ```bash
   node scripts/create-schema.js
   ```

2. **Verify the schema was created**:
   ```bash
   node scripts/check-tables.js
   ```

3. **Test the full pipeline** (optional):
   ```bash
   node scripts/golden-path-test.js
   ```

4. **Continue with Task 1.2** in the main development guide

## You're Done! 🎉

Your ClickHouse analytics database is now ready. WatchLLM will automatically start sending usage data for real-time analytics and dashboards.
