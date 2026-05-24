import { parseWorkspacePath } from '../../../artifacts/ArtifactStore'
import { saveSkillArtifact } from '../../../lib/skillArtifact'
import {
  generateImagePng,
  getImageProviderStatus,
  isImageServiceConfigured,
} from '../../../modules/image-generation'

export interface CreateImageInput {
  userId: string
  workspacePath: string
  prompt: string
  aspectRatio?: string
  negativePrompt?: string
  references?: unknown[]
  referenceImages?: unknown[]
  styleOptions?: Record<string, unknown>
  generationMode?: string
  styleProfile?: Record<string, unknown> | null
  traceId?: string
  debug?: Record<string, unknown>
  onProgress?: (message: string) => void
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
    const status = getImageProviderStatus()
    return {
      success: false,
      error: status.error || '图片生成服务未配置',
      status: 503,
    }
  }

  try {
    const generated = await generateImagePng({
      prompt,
      aspectRatio: input.aspectRatio,
      negativePrompt: input.negativePrompt,
      references: input.references,
      referenceImages: input.referenceImages,
      styleOptions: input.styleOptions,
      generationMode: input.generationMode,
      styleProfile: input.styleProfile,
      traceId: input.traceId,
      debug: input.debug,
    }, input.onProgress)
    const title = prompt.slice(0, 40) || 'AI 图片'
    const artifact = saveSkillArtifact({
      userId: input.userId,
      workspacePath: input.workspacePath,
      skillId: 'web.image.generate',
      type: 'image',
      title,
      filename: 'image.png',
      format: 'png',
      content: generated.png,
      sourceRefs: [{ type: 'manual', id: 'image-prompt', label: prompt.slice(0, 120) }],
      metadata: {
        provider: generated.provider,
        model: generated.model,
        endpointConfigured: generated.endpointConfigured,
        keyConfigured: generated.keyConfigured,
        aspectRatio: generated.aspectRatio,
        generationMode: generated.generationMode,
        referenceCount: generated.referenceCount,
        prompt,
        fallbackNotes: generated.fallbackNotes,
      },
    })
    return { success: true, artifactId: artifact.id, artifact }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg, status: 500 }
  }
}
