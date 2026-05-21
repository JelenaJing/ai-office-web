export function getSkillStoreEmbedUrl(): { url: string } | { error: string } {
  const url =
    process.env.SKILL_STORE_URL?.trim() ||
    process.env.STORE_WEB_URL?.trim() ||
    ''
  if (!url) {
    return { error: 'Skill Store 未配置：请设置服务器环境变量 SKILL_STORE_URL' }
  }
  return { url }
}
