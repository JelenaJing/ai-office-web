#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/materials-paths.sh
source "$SCRIPT_DIR/lib/materials-paths.sh"
resolve_materials_paths "$SCRIPT_DIR"
setup_conda_env
require_uvicorn_in_conda

PORT="${MATERIALS_CALC_PORT:-8030}"
HOST="${MATERIALS_CALC_HOST:-127.0.0.1}"
RELOAD="${MATERIALS_UVICORN_RELOAD:-0}"
AUTO_RESTART="${MATERIALS_AUTO_RESTART:-1}"

if [[ ! -d "$MATERIALS_CALC" ]]; then
  echo "[materials] 未找到 calc-service: $MATERIALS_CALC" >&2
  exit 1
fi

if materials_health_ok "$HOST" "$PORT"; then
  echo "[materials] 计算服务已在运行 @ http://${HOST}:${PORT}"
  exit 0
fi

if ! port_is_free "$HOST" "$PORT"; then
  echo "[materials] 端口 ${PORT} 被占用但 /health 不可用，请手动释放后重试。" >&2
  exit 1
fi

run_uvicorn_once() {
  cd "$MATERIALS_CALC"
  if [[ "$RELOAD" == "1" ]]; then
    "$CONDA_PYTHON" -m uvicorn main:app --host "$HOST" --port "$PORT" --reload --reload-dir "$MATERIALS_CALC"
  else
    "$CONDA_PYTHON" -m uvicorn main:app --host "$HOST" --port "$PORT"
  fi
}

echo "[materials] 使用 conda 环境: ${CONDA_ENV_NAME}"
echo "[materials] 启动配方计算服务 @ http://${HOST}:${PORT} (reload=${RELOAD})"

if [[ "$AUTO_RESTART" == "1" ]]; then
  while true; do
    set +e
    run_uvicorn_once
    code=$?
    set -e
    echo "[materials] calc 退出 code=${code}，3 秒后自动重启..." >&2
    sleep 3
  done
else
  run_uvicorn_once
fi
