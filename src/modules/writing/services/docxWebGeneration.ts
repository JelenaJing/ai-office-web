import { platformApi } from '../../../platform'
import type { Artifact, SkillResult } from '../../../platform'

export async function runWebDocxCreate(
  prompt: string,
  workspacePath: string,
): Promise<SkillResult> {
  return platformApi.skills.run('web.docx.create', {
    prompt: prompt.trim(),
    workspacePath,
  })
}

export function webDocxSuccessMessage(artifact: Artifact): string {
  const name = artifact.exports?.[0]?.filename || artifact.title || '文稿'
  return `文稿已生成（${name}）。可在资源中心 › 生成记录查看并下载。`
}
