#!/bin/sh
set -e

ROLE=${WATCHLLM_ROLE:-dashboard}

if [ "$ROLE" = "worker" ]; then
  echo "[WatchLLM] Starting standalone worker on port ${WORKER_PORT:-8080}"
  exec node --loader tsx ./worker/standalone.ts
fi

echo "[WatchLLM] Starting dashboard on port ${PORT:-3000}"
exec node dashboard/server.js
