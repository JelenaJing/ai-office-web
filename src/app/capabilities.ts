/** 前端展示层隐藏的旧 Skill / 兼容 ID（仍可能存在于 /api/skills，不在 UI 列出）。 */
export const LEGACY_HIDDEN_SKILL_IDS = [
  'web.pptx.create',
  'minimax.pptx-generator',
  'minimax.pptx_generator',
  'web.document.generate',
  'web.document.edit',
  'web.docx.create',
] as const

export function isLegacyHiddenSkillId(skillId: string): boolean {
  const normalized = skillId.trim().toLowerCase()
  return LEGACY_HIDDEN_SKILL_IDS.some(id => id.toLowerCase() === normalized)
}
