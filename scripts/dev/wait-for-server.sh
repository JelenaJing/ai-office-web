#!/usr/bin/env bash
# 等待主站 BFF 就绪后再启动 Vite，避免 ECONNREFUSED 127.0.0.1:3001
set -euo pipefail

HOST="${WAIT_HOST:-127.0.0.1}"
PORT="${WAIT_PORT:-3001}"
MAX_WAIT_SEC="${WAIT_MAX_SEC:-90}"
URL="http://${HOST}:${PORT}/api/health"

echo "[wait] 等待主站 BFF ${URL} （最多 ${MAX_WAIT_SEC}s）..."
for ((i = 1; i <= MAX_WAIT_SEC; i++)); do
  if curl -sf --max-time 2 "$URL" >/dev/null 2>&1; then
    echo "[wait] 主站已就绪 (${i}s)"
    exit 0
  fi
  sleep 1
done

echo "[wait] 超时：主站 ${HOST}:${PORT} 未响应，请检查 npm run dev:server 日志" >&2
exit 1
