# shellcheck shell=bash
# Research 测试栈环境辅助（仅 dev/ 使用）

research_llm_key_present() {
  [[ -n "${LLM_API_KEY:-}" || -n "${QWEN_API_KEY:-}" || -n "${DEEPSEEK_API_KEY:-}" || -n "${OPENAI_API_KEY:-}" ]]
}

# 从 server/.env.local 读取 LLM 相关变量（当 research-test.env 未填 Key 时）
merge_research_llm_from_env_local() {
  local env_local="${1:?server dir}/.env.local"
  [[ -f "${env_local}" ]] || return 1
  research_llm_key_present && return 0

  local keys=(LLM_PROVIDER LLM_API_KEY LLM_BASE_URL LLM_MODEL QWEN_API_KEY DEEPSEEK_API_KEY OPENAI_API_KEY CUHK_API_KEY)
  local key line val
  local merged=0
  for key in "${keys[@]}"; do
    line=$(grep -m1 -E "^${key}=" "${env_local}" 2>/dev/null || true)
    [[ -n "${line}" ]] || continue
    val="${line#*=}"
    val="${val%$'\r'}"
    val="${val#\"}"
    val="${val%\"}"
    val="${val#\'}"
    val="${val%\'}"
    [[ -n "${val}" ]] || continue
    export "${key}=${val}"
    merged=1
  done
  [[ "${merged}" -eq 1 ]]
}

export_research_llm_env() {
  export LLM_PROVIDER LLM_API_KEY LLM_BASE_URL LLM_MODEL
  export QWEN_API_KEY DEEPSEEK_API_KEY OPENAI_API_KEY CUHK_API_KEY
  export OPENALEX_EMAIL
  export RESEARCH_SKILL_TIMEOUT_MS RESEARCH_IDEA_FULLTEXT_TIMEOUT_MS
}
