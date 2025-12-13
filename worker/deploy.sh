#!/bin/bash
set -e

echo "🚀 Deploying Worker to Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler is not installed. Please install it with 'npm install -g wrangler'"
    exit 1
fi

# Deploy
cd worker
pnpm install
wrangler deploy --env production

echo "✅ Worker deployed successfully!"
