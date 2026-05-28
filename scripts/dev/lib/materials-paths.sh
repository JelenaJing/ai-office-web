# shellcheck shell=bash
# 材料平台路径（被 start-materials-*.sh source）
resolve_materials_paths() {
  local dev_scripts_dir="${1:?dev scripts dir required}"
  local web_root repo_root
  web_root="$(cd "$dev_scripts_dir/../.." && pwd)"
  repo_root="$(cd "$web_root/.." && pwd)"
  MATERIALS_ROOT="${MATERIALS_PLATFORM_ROOT:-$repo_root/advanced-materials-platform}"
  MATERIALS_BACKEND="$MATERIALS_ROOT/backend"
  MATERIALS_CALC="$MATERIALS_ROOT/calc-service"
}

setup_conda_env() {
  CONDA_ENV_NAME="${CONDA_ENV_NAME:-lab527}"
  if ! command -v conda >/dev/null 2>&1; then
    echo "[materials] 未找到 conda，请先安装/配置 conda。" >&2
    exit 1
  fi
  resolve_conda_python
  if ! "$CONDA_PYTHON" -V >/dev/null 2>&1; then
    echo "[materials] 未找到 conda 环境: $CONDA_ENV_NAME" >&2
    echo "[materials] 请先创建，或设置 CONDA_ENV_NAME=<你的环境名>" >&2
    exit 1
  fi
}

resolve_conda_python() {
  local conda_base="${CONDA_BASE:-$(conda info --base 2>/dev/null)}"
  CONDA_PYTHON="${conda_base}/envs/${CONDA_ENV_NAME}/bin/python"
  if [[ ! -x "$CONDA_PYTHON" ]]; then
    echo "[materials] 找不到 Python: $CONDA_PYTHON" >&2
    exit 1
  fi
}

require_uvicorn_in_conda() {
  if ! "$CONDA_PYTHON" -c "import uvicorn" >/dev/null 2>&1; then
    echo "[materials] conda 环境 $CONDA_ENV_NAME 缺少 uvicorn，请执行:" >&2
    echo "  conda run -n $CONDA_ENV_NAME pip install -r advanced-materials-platform/backend/requirements.txt" >&2
    echo "  conda run -n $CONDA_ENV_NAME pip install -r advanced-materials-platform/calc-service/requirements.txt" >&2
    exit 1
  fi
}

materials_health_ok() {
  local host="${1:-127.0.0.1}"
  local port="${2:-8040}"
  curl -sf --max-time 2 "http://${host}:${port}/health" >/dev/null 2>&1
}

port_is_free() {
  local host="${1:-127.0.0.1}"
  local port="${2:-8040}"
  MATERIALS_CHECK_HOST="$host" MATERIALS_CHECK_PORT="$port" python3 - <<'PY'
import os
import socket

host = os.environ.get("MATERIALS_CHECK_HOST", "127.0.0.1")
port = int(os.environ.get("MATERIALS_CHECK_PORT", "8040"))
s = socket.socket()
try:
    s.bind((host, port))
    ok = True
except OSError:
    ok = False
finally:
    s.close()
raise SystemExit(0 if ok else 1)
PY
}
