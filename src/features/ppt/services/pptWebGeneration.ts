import { platformApi } from '../../../platform'
import type { SkillResult } from '../../../platform'

export async function runWebPptxCreate(input: {
  workspacePath: string
  title: string
  prompt: string
  templateId?: string
}): Promise<SkillResult> {
  return platformApi.skills.run('web.pptx.create', {
    prompt: input.prompt.trim() || input.title,
    workspacePath: input.workspacePath,
    params: {
      title: input.title.trim() || '演示文稿',
      templateId: input.templateId,
    },
  })
}
