#!/usr/bin/env bash
# Research 测试 UI（Vite）— 由 start-research-test-stack.sh 调用
set -euo pipefail

UI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/research-frontend-test" && pwd)"
cd "${UI_DIR}"

export RESEARCH_TEST_UI_PORT="${RESEARCH_TEST_UI_PORT:-25176}"
export RESEARCH_TEST_BFF_PORT="${RESEARCH_TEST_BFF_PORT:-13001}"
export RESEARCH_TEST_FASTAPI_PORT="${RESEARCH_TEST_FASTAPI_PORT:-18020}"
export VITE_API_BASE="${VITE_API_BASE:-http://127.0.0.1:${RESEARCH_TEST_BFF_PORT}}"
export VITE_PAPER_REMAKE_BASE="${VITE_PAPER_REMAKE_BASE:-http://127.0.0.1:${RESEARCH_TEST_FASTAPI_PORT}}"

if [[ ! -d node_modules ]]; then
  npm install --no-audit --no-fund
fi

# 使用 vite.config.ts 中的 port/host（避免 package.json 与 config 重复指定端口）
exec npx vite --host 0.0.0.0 --strictPort
