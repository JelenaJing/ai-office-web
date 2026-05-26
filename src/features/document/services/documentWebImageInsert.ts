import { generateImage } from '../../image/services/ImageService'
import { resolveWebApiUrl } from '../../../runtime/apiBase'
import { platformApi } from '../../../platform'

const IMAGE_INTENT_RE = /图|插图|配图|图文并茂|画一张|生成.*图|插入.*图/i

export function shouldGenerateImageForInstruction(instruction: string): boolean {
  return IMAGE_INTENT_RE.test(instruction.trim())
}

function buildFigureHtml(imageUrl: string, alt: string): string {
  const safeAlt = alt.replace(/"/g, '&quot;').slice(0, 120)
  return `<figure class="ai-generated-figure" contenteditable="false"><img src="${imageUrl}" alt="${safeAlt}" style="max-width:100%;height:auto;display:block;margin:12px auto;border-radius:8px;" /><figcaption contenteditable="true">${safeAlt}</figcaption></figure>`
}

export async function generateDocumentFigureHtml(
  instruction: string,
  workspacePath: string,
): Promise<string | null> {
  const prompt = instruction.trim().slice(0, 500) || '与文稿主题相关的配图'
  const result = await generateImage({
    prompt,
    workspacePath,
    aspectRatio: '16:9',
    generationMode: 'style-continuation',
  })

  if (result.status !== 'success') {
    console.warn('[document:image]', result.error || '图片生成失败')
    return null
  }

  if (result.image_url) {
    return buildFigureHtml(result.image_url, result.alt || prompt)
  }

  const artifactId = typeof result.file_path === 'string' ? result.file_path : ''
  if (artifactId) {
    const url = resolveWebApiUrl(`/api/artifacts/${encodeURIComponent(artifactId)}/download`)
    return buildFigureHtml(url, result.alt || prompt)
  }

  return null
}
