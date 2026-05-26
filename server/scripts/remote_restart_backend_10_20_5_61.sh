#!/usr/bin/env bash
# 在 10.20.5.61 上运行：安装 backend 依赖并重启 uvicorn（端口 8020）。
# 通常由 deploy_idea_plot_to_10_20_5_61.sh 通过 ssh 调用；也可登录目标机后手动执行。
set -euo pipefail

ROOT="${PAPER_REMAKE_ROOT:-/data/darebug/aioffice-server/ai-office-web/server}"
BACKEND="${ROOT}/backend"
PORT="${PAPER_REMAKE_PORT:-8020}"
ACTION="${1:-install-and-restart}"

cd "${BACKEND}"

if [[ ! -f .env ]]; then
  echo "警告: ${BACKEND}/.env 不存在。请从 .env.example 复制并填写 DEEPSEEK_API_KEY、OPENALEX_EMAIL。"
  if [[ -f .env.example ]]; then
    echo "  cp .env.example .env && 编辑后重新运行本脚本"
  fi
fi

install_deps() {
  if [[ -d .venv ]]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
  elif [[ -d venv ]]; then
    # shellcheck disable=SC1091
    source venv/bin/activate
  fi
  python3 -m pip install -q -r requirements.txt
}

stop_old() {
  local pid
  pid="$(lsof -ti:"${PORT}" 2>/dev/null || true)"
  if [[ -n "${pid}" ]]; then
    echo "停止占用端口 ${PORT} 的进程: ${pid}"
    kill "${pid}" 2>/dev/null || kill -9 "${pid}" 2>/dev/null || true
    sleep 1
  fi
}

start_backend() {
  mkdir -p "${ROOT}/logs"
  if [[ -d .venv ]]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
  elif [[ -d venv ]]; then
    # shellcheck disable=SC1091
    source venv/bin/activate
  fi
  nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" \
    >> "${ROOT}/logs/backend_${PORT}.log" 2>&1 &
  echo "后端已后台启动，端口 ${PORT}，日志: ${ROOT}/logs/backend_${PORT}.log"
  sleep 2
  curl -sf "http://127.0.0.1:${PORT}/health" && echo "" || echo "健康检查未通过，请查看日志"
}

case "${ACTION}" in
  install-and-restart)
    install_deps
    stop_old
    start_backend
    ;;
  restart-only)
    stop_old
    start_backend
    ;;
  install-only)
    install_deps
    ;;
  *)
    echo "用法: $0 [install-and-restart|restart-only|install-only]"
    exit 1
    ;;
esac
