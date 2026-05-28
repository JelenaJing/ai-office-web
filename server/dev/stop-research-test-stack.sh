#!/usr/bin/env bash
# 强制释放 Research 测试栈端口（脚本卡死或 Ctrl+C 无效时用）
set -uo pipefail

RESEARCH_TEST_FASTAPI_PORT="${RESEARCH_TEST_FASTAPI_PORT:-18020}"
RESEARCH_TEST_BFF_PORT="${RESEARCH_TEST_BFF_PORT:-13001}"
RESEARCH_TEST_UI_PORT="${RESEARCH_TEST_UI_PORT:-25176}"

kill_port() {
  local port="$1"
  local name="$2"
  echo "==> 释放 ${name} :${port}"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null && echo "    已结束占用进程" && return 0
  fi
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti ":${port}" 2>/dev/null || true)
    if [[ -n "${pids}" ]]; then
      echo "${pids}" | xargs -r kill -TERM 2>/dev/null || true
      sleep 1
      echo "${pids}" | xargs -r kill -KILL 2>/dev/null || true
      echo "    已结束占用进程"
      return 0
    fi
  fi
  echo "    端口未被占用或缺少 fuser/lsof"
}

kill_port "${RESEARCH_TEST_FASTAPI_PORT}" "FastAPI"
kill_port "${RESEARCH_TEST_BFF_PORT}" "BFF"
kill_port "${RESEARCH_TEST_UI_PORT}" "测试 UI"
echo "完成。"
