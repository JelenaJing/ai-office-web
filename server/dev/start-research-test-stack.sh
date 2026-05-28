#!/usr/bin/env bash
# 一键启动 Research 测试栈：FastAPI :18020 + BFF :13001 + 测试 UI :25176
# 用法: bash dev/start-research-test-stack.sh
# 停止: Ctrl+C 一次即可（或 bash dev/stop-research-test-stack.sh）

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=lib/research-test-env.sh
source "${SCRIPT_DIR}/lib/research-test-env.sh"
BACKEND_DIR="${SERVER_DIR}/backend"
UI_DIR="${SCRIPT_DIR}/research-frontend-test"
LOG_DIR="${SCRIPT_DIR}/.logs"

# 测试栈专用配置（不修改正式版 server/.env.example / backend/.env.example）
for _env_file in "${SCRIPT_DIR}/research-test.ports.env" "${SCRIPT_DIR}/research-test.env"; do
  if [[ -f "${_env_file}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${_env_file}"
    set +a
    echo "==> 已加载 ${_env_file}"
  fi
done

if merge_research_llm_from_env_local "${SERVER_DIR}"; then
  echo "==> 已从 server/.env.local 回落 LLM 配置（research-test.env 未填 Key 时）"
fi
export_research_llm_env

sync_sciencerelay_mirror() {
  local src="${SCIENCERELAY_SYNC_SOURCE:-}"
  local dest="${SCIENCERELAY_LOCAL_MIRROR:-${SCRIPT_DIR}/.cache/sciencerelay-remote}"
  if [[ -n "${dest}" && "${dest}" != /* ]]; then
    dest="${SERVER_DIR}/${dest}"
  fi
  if [[ "${SCIENCERELAY_SYNC_ON_START:-0}" != "1" ]]; then
    return 0
  fi
  if [[ -z "${src}" ]]; then
    echo "    跳过同步: 未设置 SCIENCERELAY_SYNC_SOURCE / SCIENCERELAY_SYNC_ON_START"
    return 0
  fi
  if ! command -v rsync >/dev/null 2>&1; then
    echo "    跳过同步: 未安装 rsync（可手动 rsync 到 ${dest}）"
    return 0
  fi
  mkdir -p "${dest}"
  echo "==> 同步 Science Relay 数据: ${src} -> ${dest}"
  rsync -az --delete "${src}/" "${dest}/" 2>/dev/null || {
    echo "    警告: rsync 失败，请检查 SSH 与路径"
    return 0
  }
  export SCIENCERELAY_DATA_DIR="${dest}"
  export SCIENCERELAY_DATA_SOURCE_MODE=local
  echo "    已设置 SCIENCERELAY_DATA_DIR=${SCIENCERELAY_DATA_DIR}"
}

resolve_sciencerelay_data_dir() {
  local dir="${SCIENCERELAY_DATA_DIR:-}"
  [[ -z "${dir}" ]] && return 0
  if [[ "${dir}" != /* ]]; then
    export SCIENCERELAY_DATA_DIR="${SERVER_DIR}/${dir}"
  fi
}

sync_sciencerelay_mirror
resolve_sciencerelay_data_dir

RESEARCH_TEST_FASTAPI_PORT="${RESEARCH_TEST_FASTAPI_PORT:-18020}"
RESEARCH_TEST_BFF_PORT="${RESEARCH_TEST_BFF_PORT:-13001}"
RESEARCH_TEST_UI_PORT="${RESEARCH_TEST_UI_PORT:-25176}"
RESEARCH_CONDA_ENV="${RESEARCH_CONDA_ENV:-aios-research-backend}"
PAPER_REMAKE_BASE_URL="${PAPER_REMAKE_BASE_URL:-http://127.0.0.1:${RESEARCH_TEST_FASTAPI_PORT}}"

STACK_PIDS=()
CLEANED=0

mkdir -p "${LOG_DIR}"

kill_tree() {
  local pid="$1"
  [[ -z "${pid}" || ! "${pid}" =~ ^[0-9]+$ ]] && return 0
  local child
  while IFS= read -r child; do
    [[ -n "${child}" ]] && kill_tree "${child}"
  done < <(pgrep -P "${pid}" 2>/dev/null || true)
  kill -TERM "${pid}" 2>/dev/null || true
}

kill_port() {
  local port="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -ti ":${port}" 2>/dev/null | xargs -r kill -TERM 2>/dev/null || true
  fi
}

cleanup() {
  [[ "${CLEANED}" -eq 1 ]] && exit 130
  CLEANED=1
  trap - INT TERM EXIT HUP

  echo ""
  echo "==> 停止 Research 测试栈..."

  local pid
  for pid in "${STACK_PIDS[@]}"; do
    kill_tree "${pid}"
  done

  sleep 1
  for pid in "${STACK_PIDS[@]}"; do
    kill -KILL "${pid}" 2>/dev/null || true
  done

  for port in "${RESEARCH_TEST_FASTAPI_PORT}" "${RESEARCH_TEST_BFF_PORT}" "${RESEARCH_TEST_UI_PORT}"; do
    kill_port "${port}"
  done

  echo "已退出。"
  exit 130
}

trap cleanup INT TERM HUP

start_bg() {
  local label="$1"
  local logfile="$2"
  local cmd="$3"
  : >"${logfile}"
  # setsid：独立进程组；日志在子进程内重定向，避免抢 SIGINT
  setsid bash -c "${cmd}" >>"${logfile}" 2>&1 </dev/null &
  local pid=$!
  STACK_PIDS+=("${pid}")
  echo "    pid=${pid} (${label})"
}

check_port_free() {
  local port="$1"
  local name="$2"
  if command -v ss >/dev/null 2>&1; then
    if ss -tln | grep -q ":${port} "; then
      echo "错误: 端口 ${port} (${name}) 已被占用。可先运行: bash dev/stop-research-test-stack.sh"
      exit 1
    fi
  fi
}

echo "==> 检查测试端口..."
check_port_free "${RESEARCH_TEST_FASTAPI_PORT}" "FastAPI"
check_port_free "${RESEARCH_TEST_BFF_PORT}" "BFF"
check_port_free "${RESEARCH_TEST_UI_PORT}" "测试 UI"

echo "==> [1/3] FastAPI @ ${RESEARCH_TEST_FASTAPI_PORT} (conda: ${RESEARCH_CONDA_ENV})"
if ! command -v conda >/dev/null 2>&1; then
  echo "错误: 未找到 conda。请先安装 conda 并运行: bash dev/setup-research-conda.sh"
  exit 1
fi
CONDA_BASE="$(conda info --base)"
# shellcheck disable=SC1091
source "${CONDA_BASE}/etc/profile.d/conda.sh"
if ! conda env list | awk '{print $1}' | grep -qx "${RESEARCH_CONDA_ENV}"; then
  echo "错误: conda 环境「${RESEARCH_CONDA_ENV}」不存在。"
  echo "请先运行: bash dev/setup-research-conda.sh"
  exit 1
fi
if [[ ! -f "${SCRIPT_DIR}/research-test.env" ]]; then
  echo "    提示: 可选 cp dev/research-test.env.example dev/research-test.env"
fi
if ! research_llm_key_present; then
  echo "    错误: 未找到 LLM API Key。请填写 dev/research-test.env 或 server/.env.local 中的 QWEN_API_KEY / LLM_API_KEY"
  exit 1
fi
echo "    LLM provider=${LLM_PROVIDER:-（未设，由 unified_llm 解析）}"
IDEA_PAPER_MAX_CHARS="${IDEA_PAPER_MAX_CHARS:-1000}"
export IDEA_PAPER_MAX_CHARS
FASTAPI_CMD="source $(printf '%q' "${CONDA_BASE}/etc/profile.d/conda.sh") && conda activate $(printf '%q' "${RESEARCH_CONDA_ENV}") && cd $(printf '%q' "${BACKEND_DIR}") && export IDEA_PAPER_MAX_CHARS=$(printf '%q' "${IDEA_PAPER_MAX_CHARS}") LLM_PROVIDER=$(printf '%q' "${LLM_PROVIDER:-}") LLM_API_KEY=$(printf '%q' "${LLM_API_KEY:-}") LLM_BASE_URL=$(printf '%q' "${LLM_BASE_URL:-}") LLM_MODEL=$(printf '%q' "${LLM_MODEL:-}") QWEN_API_KEY=$(printf '%q' "${QWEN_API_KEY:-}") DEEPSEEK_API_KEY=$(printf '%q' "${DEEPSEEK_API_KEY:-}") OPENAI_API_KEY=$(printf '%q' "${OPENAI_API_KEY:-}") CUHK_API_KEY=$(printf '%q' "${CUHK_API_KEY:-}") OPENALEX_EMAIL=$(printf '%q' "${OPENALEX_EMAIL:-}") && exec uvicorn app.main:app --host 0.0.0.0 --port ${RESEARCH_TEST_FASTAPI_PORT}"
start_bg "fastapi" "${LOG_DIR}/fastapi.log" "${FASTAPI_CMD}"

echo "==> [2/3] Express BFF @ ${RESEARCH_TEST_BFF_PORT} → ${PAPER_REMAKE_BASE_URL}"
RESEARCH_SKILL_TIMEOUT_MS="${RESEARCH_SKILL_TIMEOUT_MS:-600000}"
RESEARCH_IDEA_FULLTEXT_TIMEOUT_MS="${RESEARCH_IDEA_FULLTEXT_TIMEOUT_MS:-600000}"
export RESEARCH_SKILL_TIMEOUT_MS RESEARCH_IDEA_FULLTEXT_TIMEOUT_MS
BFF_CMD="cd $(printf '%q' "${SERVER_DIR}") && export PORT=${RESEARCH_TEST_BFF_PORT} PAPER_REMAKE_BASE_URL=$(printf '%q' "${PAPER_REMAKE_BASE_URL}") DOTENV_CONFIG_PATH=$(printf '%q' "${DOTENV_CONFIG_PATH:-.env.local}") SKILL_TIMEOUT_MS=$(printf '%q' "${RESEARCH_SKILL_TIMEOUT_MS}") SCIENCERELAY_DATA_DIR=$(printf '%q' "${SCIENCERELAY_DATA_DIR:-}") SCIENCERELAY_DATA_SOURCE_MODE=$(printf '%q' "${SCIENCERELAY_DATA_SOURCE_MODE:-local}") SCIENCERELAY_DATA_HTTP_BASE=$(printf '%q' "${SCIENCERELAY_DATA_HTTP_BASE:-}") SCIENCERELAY_CACHE_TTL_MS=$(printf '%q' "${SCIENCERELAY_CACHE_TTL_MS:-30000}") && { [[ ! -d node_modules ]] && npm install --no-audit --no-fund; }; exec npm run dev"
start_bg "bff" "${LOG_DIR}/bff.log" "${BFF_CMD}"

echo "==> [3/3] 测试 UI @ ${RESEARCH_TEST_UI_PORT}"
export RESEARCH_TEST_UI_PORT RESEARCH_TEST_BFF_PORT RESEARCH_TEST_FASTAPI_PORT
export VITE_API_BASE="http://127.0.0.1:${RESEARCH_TEST_BFF_PORT}"
export VITE_PAPER_REMAKE_BASE="${PAPER_REMAKE_BASE_URL}"
UI_CMD="export RESEARCH_TEST_UI_PORT=$(printf '%q' "${RESEARCH_TEST_UI_PORT}") RESEARCH_TEST_BFF_PORT=$(printf '%q' "${RESEARCH_TEST_BFF_PORT}") RESEARCH_TEST_FASTAPI_PORT=$(printf '%q' "${RESEARCH_TEST_FASTAPI_PORT}") VITE_API_BASE=$(printf '%q' "${VITE_API_BASE}") VITE_PAPER_REMAKE_BASE=$(printf '%q' "${VITE_PAPER_REMAKE_BASE}") && exec $(printf '%q' "${SCRIPT_DIR}/run-research-ui.sh")"
start_bg "ui" "${LOG_DIR}/ui.log" "${UI_CMD}"

port_listening() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -tln | grep -q ":${port} "
    return $?
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti ":${port}" >/dev/null 2>&1
    return $?
  fi
  return 1
}

http_reachable() {
  local url="$1"
  local code
  code=$(curl -4 -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 "${url}" 2>/dev/null || echo "000")
  [[ "${code}" =~ ^[23] ]]
}

wait_for_url() {
  local url="$1"
  local name="$2"
  local max="${3:-60}"
  local i=0
  while (( i < max )); do
    if [[ "${CLEANED}" -eq 1 ]]; then
      exit 130
    fi
    if http_reachable "${url}"; then
      echo "    ✓ ${name} 就绪"
      return 0
    fi
    sleep 1 || exit 130
    ((i++)) || true
  done
  echo "    ✗ ${name} 超时（见 ${LOG_DIR}/*.log）"
  return 1
}

wait_for_vite_ui() {
  local port="$1"
  local max="${2:-120}"
  local i=0
  local url
  while (( i < max )); do
    if [[ "${CLEANED}" -eq 1 ]]; then
      exit 130
    fi
    if port_listening "${port}"; then
      for url in "http://127.0.0.1:${port}/" "http://localhost:${port}/"; do
        if http_reachable "${url}"; then
          echo "    ✓ 测试 UI 就绪 (${url})"
          return 0
        fi
      done
      # Vite 已监听但 curl 探测失败时（少见），仍视为可用
      if (( i > 15 )); then
        echo "    ✓ 测试 UI 端口 :${port} 已监听（HTTP 探测未通过，请直接用浏览器打开）"
        return 0
      fi
    fi
    sleep 1 || exit 130
    ((i++)) || true
  done
  echo "    ✗ 测试 UI 超时（见 ${LOG_DIR}/ui.log）"
  if [[ -f "${LOG_DIR}/ui.log" ]]; then
    echo "    --- ui.log 末尾 ---"
    tail -8 "${LOG_DIR}/ui.log" | sed 's/^/    /'
  fi
  return 1
}

echo ""
echo "==> 等待服务启动（Ctrl+C 可立即退出）..."
wait_for_url "http://127.0.0.1:${RESEARCH_TEST_FASTAPI_PORT}/health" "FastAPI" 90 || true
wait_for_url "http://127.0.0.1:${RESEARCH_TEST_BFF_PORT}/api/research/parity" "BFF" 120 || true
wait_for_vite_ui "${RESEARCH_TEST_UI_PORT}" 120 || true

echo ""
echo "=============================================="
echo " Research 测试栈已运行（Ctrl+C 停止全部）"
echo "----------------------------------------------"
echo " 测试 UI:  http://127.0.0.1:${RESEARCH_TEST_UI_PORT}  （服务器本机）"
echo "           http://$(hostname -I 2>/dev/null | awk '{print $1}'):${RESEARCH_TEST_UI_PORT}  （局域网，需防火墙放行）"
echo " BFF:      http://127.0.0.1:${RESEARCH_TEST_BFF_PORT}/api/research/parity"
echo " FastAPI:  http://127.0.0.1:${RESEARCH_TEST_FASTAPI_PORT}/docs"
echo " 日志:     ${LOG_DIR}/fastapi.log | bff.log | ui.log"
echo " 强制停止: bash dev/stop-research-test-stack.sh"
echo "=============================================="
echo ""

# 挂起直到子进程结束或 Ctrl+C（不用 tail -f，避免抢 SIGINT）
while [[ "${CLEANED}" -eq 0 ]]; do
  local_alive=0
  for pid in "${STACK_PIDS[@]}"; do
    if kill -0 "${pid}" 2>/dev/null; then
      local_alive=1
      break
    fi
  done
  if [[ "${local_alive}" -eq 0 ]]; then
    echo "子进程已全部退出，见 ${LOG_DIR}/*.log"
    exit 1
  fi
  sleep 2 || exit 130
done

exit 130
