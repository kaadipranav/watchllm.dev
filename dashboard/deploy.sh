#!/bin/bash
set -e

echo "🚀 Deploying Dashboard to Vercel..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: vercel is not installed. Please install it with 'npm install -g vercel'"
    exit 1
fi

# Deploy
cd dashboard
pnpm install
vercel --prod

echo "✅ Dashboard deployed successfully!"
