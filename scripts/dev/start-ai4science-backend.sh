#!/usr/bin/env bash
# ai4science 电池寿命模型 API（FastAPI，默认 8082）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_ROOT="$(cd "$WEB_ROOT/.." && pwd)"
AI4SCIENCE_ROOT="${AI4SCIENCE_ROOT:-$REPO_ROOT/ai4science}"

PORT="${AI4SCIENCE_API_PORT:-8082}"
HOST="${AI4SCIENCE_API_HOST:-127.0.0.1}"
CONDA_ENV_NAME="${AI4SCIENCE_CONDA_ENV:-${CONDA_ENV_NAME:-lab527}}"

api_ok() {
  curl -sf --max-time 2 "http://${HOST}:${PORT}/api/meta" >/dev/null 2>&1
}

if api_ok; then
  echo "[ai4science] API 已在运行 @ http://${HOST}:${PORT}"
  exit 0
fi

if ! command -v conda >/dev/null 2>&1; then
  echo "[ai4science] 未找到 conda，无法启动后端。" >&2
  exit 1
fi

CONDA_BASE="${CONDA_BASE:-$(conda info --base 2>/dev/null)}"
PYTHON="${CONDA_BASE}/envs/${CONDA_ENV_NAME}/bin/python"
if [[ ! -x "$PYTHON" ]]; then
  echo "[ai4science] 未找到 conda 环境 ${CONDA_ENV_NAME} 的 Python: $PYTHON" >&2
  exit 1
fi

if [[ ! -f "$AI4SCIENCE_ROOT/backend/app.py" ]]; then
  echo "[ai4science] 未找到后端: $AI4SCIENCE_ROOT/backend/app.py" >&2
  exit 1
fi

if ! "$PYTHON" -c "import uvicorn, fastapi" >/dev/null 2>&1; then
  echo "[ai4science] 安装 Python 依赖…"
  "$PYTHON" -m pip install -r "$AI4SCIENCE_ROOT/backend/requirements.txt"
fi

export CYCLE_LIFE_XLSX="${CYCLE_LIFE_XLSX:-$AI4SCIENCE_ROOT/cycle_life.xlsx}"
if [[ ! -f "$CYCLE_LIFE_XLSX" ]]; then
  echo "[ai4science] 提示: 未找到 $CYCLE_LIFE_XLSX，/api/meta 可用，预测接口需该 Excel。" >&2
fi

cd "$AI4SCIENCE_ROOT"
echo "[ai4science] 启动 API @ http://${HOST}:${PORT} （conda: ${CONDA_ENV_NAME}）"
exec "$PYTHON" -m uvicorn backend.app:app --host "$HOST" --port "$PORT"
