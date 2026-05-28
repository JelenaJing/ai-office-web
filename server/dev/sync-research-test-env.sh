#!/usr/bin/env bash
# 将 dev/research-test.env 中的 LLM / OpenAlex 同步到 backend/.env（仅本地测试用）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=lib/research-test-env.sh
source "${SCRIPT_DIR}/lib/research-test-env.sh"
BACKEND_ENV="${SERVER_DIR}/backend/.env"
SRC="${SCRIPT_DIR}/research-test.env"

if [[ -f "${SRC}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${SRC}"
  set +a
fi
merge_research_llm_from_env_local "${SERVER_DIR}" || true
export_research_llm_env

if ! research_llm_key_present; then
  echo "缺少 LLM Key：请填写 dev/research-test.env 或 server/.env.local"
  exit 1
fi

if [[ ! -f "${BACKEND_ENV}" ]]; then
  cp "${SERVER_DIR}/backend/.env.example" "${BACKEND_ENV}"
  echo "已创建 ${BACKEND_ENV}"
fi

upsert() {
  local key="$1"
  local val="${2:-}"
  if [[ -z "${val}" ]]; then
    return 0
  fi
  if grep -q "^${key}=" "${BACKEND_ENV}" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "${BACKEND_ENV}"
  else
    echo "${key}=${val}" >> "${BACKEND_ENV}"
  fi
}

upsert LLM_PROVIDER "${LLM_PROVIDER:-}"
upsert LLM_API_KEY "${LLM_API_KEY:-}"
upsert LLM_BASE_URL "${LLM_BASE_URL:-}"
upsert LLM_MODEL "${LLM_MODEL:-}"
upsert QWEN_API_KEY "${QWEN_API_KEY:-}"
upsert DEEPSEEK_API_KEY "${DEEPSEEK_API_KEY:-}"
upsert OPENAI_API_KEY "${OPENAI_API_KEY:-}"
upsert OPENALEX_EMAIL "${OPENALEX_EMAIL:-}"
upsert IDEA_PAPER_MAX_CHARS "${IDEA_PAPER_MAX_CHARS:-}"

echo "已同步 LLM/OpenAlex 到 backend/.env（仅影响本机 FastAPI 测试）"
echo "可选: 将 server/.env.local 中相同 LLM_* 保留，供 BFF :13001 使用"
