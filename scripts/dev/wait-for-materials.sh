#!/usr/bin/env bash
# 等待材料平台 8040 + calc-service 8030 就绪（科研 dev 用）
set -euo pipefail

BACKEND_HOST="${MATERIALS_BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${MATERIALS_BACKEND_PORT:-8040}"
CALC_HOST="${MATERIALS_CALC_HOST:-127.0.0.1}"
CALC_PORT="${MATERIALS_CALC_PORT:-8030}"
MAX_WAIT_SEC="${WAIT_MATERIALS_MAX_SEC:-120}"

wait_one() {
  local name="$1"
  local url="$2"
  echo "[wait] 等待 ${name} ${url} （最多 ${MAX_WAIT_SEC}s）..."
  for ((i = 1; i <= MAX_WAIT_SEC; i++)); do
    if curl -sf --max-time 2 "$url" >/dev/null 2>&1; then
      echo "[wait] ${name} 已就绪 (${i}s)"
      return 0
    fi
    sleep 1
  done
  echo "[wait] 超时：${name} 未响应" >&2
  return 1
}

wait_one "材料平台 API" "http://${BACKEND_HOST}:${BACKEND_PORT}/health"
wait_one "calc-service" "http://${CALC_HOST}:${CALC_PORT}/health"
