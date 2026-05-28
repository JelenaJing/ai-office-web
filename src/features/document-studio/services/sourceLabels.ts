export function formatGenerationSourceLabel(input: {
  source?: string
  fallback?: boolean
  fallbackReason?: string | null
}): string {
  if (input.fallback) {
    const reason = input.fallbackReason?.trim()
    return reason
      ? `已使用备用生成通道（未使用 OpenCode Skill）。原因：${reason}`
      : '已使用备用生成通道（未使用 OpenCode Skill），可能因 Skill 未安装或 OpenCode 未完成输出。'
  }
  if (input.source === 'opencode') {
    return '已通过 OpenCode Skill 生成初稿。'
  }
  if (input.source === 'direct-llm' || input.source === 'llm-fallback') {
    return '已通过内置模型生成初稿（direct-llm）。'
  }
  return '文稿已生成。'
}

export function formatPatchSourceLabel(source?: string, fallback?: boolean): string {
  if (fallback) return '本次结果来自备用通道（非 OpenCode Skill）'
  if (source === 'opencode') return '本次结果来自 OpenCode Skill'
  if (source === 'direct-llm' || source === 'llm-fallback') return '本次结果来自快速模型（direct-llm）'
  return source ? `来源：${source}` : ''
}
