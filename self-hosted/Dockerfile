# =============================================================================
# WatchLLM Self-Hosted - Multi-Stage Dockerfile
# =============================================================================
# This Dockerfile creates an optimized production image for WatchLLM
# self-hosted deployments.
#
# Build: docker build -t watchllm:latest -f Dockerfile .
# Run:   docker run -p 3000:3000 --env-file .env watchllm:latest
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Install build dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY dashboard/package.json ./dashboard/
COPY worker/package.json ./worker/

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/dashboard/node_modules ./dashboard/node_modules
COPY --from=deps /app/worker/node_modules ./worker/node_modules

# Copy source
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHLLM_MODE=self_hosted

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build shared package
RUN pnpm --filter @watchllm/shared build || echo "No build script"

# Build dashboard (Next.js)
RUN pnpm --filter dashboard build

# Build worker artifacts (wrangler dry-run output)
RUN pnpm --filter @watchllm/worker build

# Build worker (if applicable for self-hosted)
# Note: Worker is typically Cloudflare-specific, but we include API routes

# -----------------------------------------------------------------------------
# Stage 3: Production Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Security: Create non-root user
RUN addgroup --system --gid 1001 watchllm && \
    adduser --system --uid 1001 watchllm

# Install runtime dependencies only
RUN apk add --no-cache curl

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV WATCHLLM_MODE=self_hosted
ENV PORT=3000

# Copy built application
COPY --from=builder /app/dashboard/public ./dashboard/public
COPY --from=builder /app/dashboard/.next/standalone ./
COPY --from=builder /app/dashboard/.next/static ./dashboard/.next/static

# Copy worker sources and dependencies for standalone runtime
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/node_modules ./node_modules

# Copy self-hosted specific files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/self-hosted/.env.example /app/.env.example
COPY --from=builder /app/self-hosted/start.sh /app/start.sh

# Create directories for data persistence
RUN mkdir -p /var/lib/watchllm/data /var/lib/watchllm/logs /etc/watchllm && \
    chown -R watchllm:watchllm /var/lib/watchllm /etc/watchllm

# Volume mounts for persistence
VOLUME ["/var/lib/watchllm/data", "/var/lib/watchllm/logs", "/etc/watchllm"]

# Switch to non-root user
USER watchllm

# Expose ports
EXPOSE 3000
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application (dashboard or worker)
CMD ["sh", "/app/start.sh"]
