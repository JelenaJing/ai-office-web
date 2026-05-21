import { parseWorkspacePath } from '../../artifacts/ArtifactStore'
import { saveSkillArtifact } from '../../lib/skillArtifact'
import { generateImagePng, isImageServiceConfigured } from '../../modules/image-generation'

export interface CreateImageInput {
  userId: string
  workspacePath: string
  prompt: string
}

export type CreateImageResult =
  | { success: true; artifactId: string; artifact: ReturnType<typeof saveSkillArtifact> }
  | { success: false; error: string; status?: number }

export async function runCreateImageSkill(
  input: CreateImageInput,
): Promise<CreateImageResult> {
  const prompt = String(input.prompt || '').trim()
  if (!prompt) {
    return { success: false, error: '请输入图片描述', status: 400 }
  }
  if (!parseWorkspacePath(input.workspacePath)) {
    return { success: false, error: 'workspacePath 无效', status: 400 }
  }
  if (!isImageServiceConfigured()) {
    return {
      success: false,
      error: '图片生成服务未配置：请联系管理员配置 IMAGE_API_KEY 或 OPENAI_API_KEY',
      status: 503,
    }
  }

  try {
    const png = await generateImagePng(prompt)
    const title = prompt.slice(0, 40) || 'AI 图片'
    const artifact = saveSkillArtifact({
      userId: input.userId,
      workspacePath: input.workspacePath,
      skillId: 'web.image.generate',
      type: 'image',
      title,
      filename: 'image.png',
      format: 'png',
      content: png,
    })
    return { success: true, artifactId: artifact.id, artifact }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg, status: 500 }
  }
}
