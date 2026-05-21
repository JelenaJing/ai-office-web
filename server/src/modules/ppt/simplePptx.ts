/**
 * Simplified PPTX builder for Web MVP (no brand template injection).
 */

import fs from 'fs'
import path from 'path'
import PptxGenJS from 'pptxgenjs'
import { invokeLlmJson, isLlmConfigured } from '../ai-gateway'

export interface SlidePlanItem {
  type: 'cover' | 'toc' | 'content' | 'summary'
  title?: string
  subtitle?: string
  items?: string[]
}

export interface GeneratedSlidePlan {
  title: string
  slides: SlidePlanItem[]
}

export async function buildSlidePlanFromPrompt(
  title: string,
  prompt: string,
): Promise<GeneratedSlidePlan> {
  const fallback: GeneratedSlidePlan = {
    title: title || '演示文稿',
    slides: [
      { type: 'cover', title: title || '演示文稿', subtitle: 'AI Office Web' },
      { type: 'toc', title: '目录', items: ['背景', '要点', '总结'] },
      { type: 'content', title: '背景', items: ['由 AI 根据主题自动生成', prompt.slice(0, 120)] },
      { type: 'content', title: '要点', items: ['要点一', '要点二', '要点三'] },
      { type: 'content', title: '展望', items: ['后续可接入完整模板引擎'] },
      { type: 'summary', title: '谢谢', items: ['Q & A'] },
    ],
  }

  if (!isLlmConfigured() || !prompt.trim()) return fallback

  try {
    const plan = await invokeLlmJson<GeneratedSlidePlan>(
      [
        {
          role: 'system',
          content:
            '生成 PPT 结构化 JSON：{ title, slides: [{ type: cover|toc|content|summary, title, subtitle?, items?[] }] }，3-6 页 content，中文。',
        },
        {
          role: 'user',
          content: JSON.stringify({ title, prompt: prompt.trim() }),
        },
      ],
      { temperature: 0.4, maxTokens: 2000 },
    )
    if (plan?.slides?.length) return { title: plan.title || title, slides: plan.slides }
  } catch {
    // use fallback
  }
  return fallback
}

export async function writePptxFile(
  plan: GeneratedSlidePlan,
  outputPath: string,
): Promise<number> {
  const pres = new PptxGenJS()
  pres.title = plan.title

  for (const slide of plan.slides) {
    const s = pres.addSlide()
    if (slide.type === 'cover') {
      s.addText(slide.title || plan.title, {
        x: 0.5, y: 2.2, w: 9, h: 1.2, fontSize: 32, bold: true, color: '1f6fd6',
      })
      if (slide.subtitle) {
        s.addText(slide.subtitle, { x: 0.5, y: 3.4, w: 9, h: 0.6, fontSize: 16, color: '64748b' })
      }
      continue
    }
    if (slide.type === 'toc') {
      s.addText(slide.title || '目录', { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 24, bold: true })
      const items = slide.items ?? []
      items.forEach((item, i) => {
        s.addText(`${i + 1}. ${item}`, {
          x: 0.8, y: 1.2 + i * 0.55, w: 8.5, h: 0.5, fontSize: 14,
        })
      })
      continue
    }
    s.addText(slide.title || '内容', { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 22, bold: true })
    const items = slide.items ?? []
    items.forEach((item, i) => {
      s.addText(`• ${item}`, {
        x: 0.6, y: 1.1 + i * 0.5, w: 8.8, h: 0.45, fontSize: 14,
      })
    })
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  await pres.writeFile({ fileName: outputPath })
  return plan.slides.length
}
