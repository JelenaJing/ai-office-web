/**
 * web.document.edit — AI 修改文稿（选区 / 插入 / 全文）
 */
import { invokeLlmJson, isLlmConfigured } from '../../modules/ai-gateway'
import { generateDocumentContentDetailed } from '../../modules/ai-gateway/documentGenerator'
import { contentToHtml, contentToMarkdown } from '../docx/documentSessionBuilder'

export type DocumentEditMode =
  | 'rewrite_selection'
  | 'insert_at_cursor'
  | 'replace_document'
  | 'polish_document'

export interface EditDocumentInput {
  instruction: string
  mode: DocumentEditMode
  title?: string
  selectedText?: string
  selectedHtml?: string
  documentText?: string
  documentHtml?: string
  templateSkillId?: string
  knowledgeBaseIds?: string[]
  fileIds?: string[]
}

export interface WebDocumentPatchJson {
  type: 'replace_selection' | 'insert_at_cursor' | 'replace_document'
  html: string
  markdown?: string
}

export type EditDocumentResult =
  | { success: true; data: { patch: WebDocumentPatchJson } }
  | { success: false; error: string }

interface LlmEditJson {
  html?: string
  markdown?: string
  title?: string
  sections?: Array<{ heading?: string; paragraphs?: string[] }>
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function simpleMarkdownToHtml(md: string): string {
  const lines = md.split('\n')
  const parts: string[] = []
  let inList = false
  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      if (inList) {
        parts.push('</ul>')
        inList = false
      }
      continue
    }
    if (t.startsWith('## ')) {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<h2>${escapeHtml(t.slice(3))}</h2>`)
    } else if (t.startsWith('# ')) {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<h1>${escapeHtml(t.slice(2))}</h1>`)
    } else if (t.startsWith('- ') || t.startsWith('* ')) {
      if (!inList) {
        parts.push('<ul>')
        inList = true
      }
      parts.push(`<li>${escapeHtml(t.replace(/^[-*]\s+/, ''))}</li>`)
    } else {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<p>${escapeHtml(t)}</p>`)
    }
  }
  if (inList) parts.push('</ul>')
  return parts.join('') || '<p></p>'
}

function sectionsToHtml(raw: LlmEditJson): string {
  if (raw.html?.trim()) return raw.html.trim()
  if (raw.markdown?.trim()) return simpleMarkdownToHtml(raw.markdown)
  if (raw.sections?.length) {
    const content = {
      title: raw.title || '文稿',
      sections: raw.sections.map((s) => ({
        heading: String(s.heading || '').trim() || '章节',
        paragraphs: (s.paragraphs || []).map((p) => String(p).trim()).filter(Boolean),
      })),
    }
    return contentToHtml(content, {})
  }
  return ''
}

function buildSystemPrompt(mode: DocumentEditMode): string {
  const base = `你是中文办公文稿编辑助手。根据用户指令修改文稿，输出 JSON：
{"html":"HTML 片段或完整正文","markdown":"可选 Markdown"}
- html 使用 <h1><h2><p><ul><li><strong> 等标签，不要用 Markdown 语法写在 html 字段里。
- 不要编造未提供的金额、客户名、合同号等事实数据；缺失处用 [待补充]。`
  if (mode === 'rewrite_selection') {
    return `${base}\n只改写用户选中的片段，html 仅包含替换后的选区内容（可含多个段落），不要包含未选中的上下文。`
  }
  if (mode === 'insert_at_cursor') {
    return `${base}\n仅输出要插入到光标处的新增内容，html 为片段即可。`
  }
  return `${base}\n输出完整正文 html（含标题与章节结构），用于替换整篇文档。`
}

function mapModeToPatchType(mode: DocumentEditMode): WebDocumentPatchJson['type'] {
  if (mode === 'rewrite_selection') return 'replace_selection'
  if (mode === 'insert_at_cursor') return 'insert_at_cursor'
  return 'replace_document'
}

function buildUserPrompt(input: EditDocumentInput): string {
  const parts: string[] = [`【用户指令】\n${input.instruction.trim()}`]
  if (input.title?.trim()) parts.push(`【文稿标题】\n${input.title.trim()}`)
  if (input.selectedText?.trim()) {
    parts.push(`【选中纯文本】\n${input.selectedText.trim()}`)
  }
  if (input.selectedHtml?.trim()) {
    parts.push(`【选中 HTML】\n${input.selectedHtml.trim().slice(0, 8000)}`)
  }
  if (input.documentText?.trim()) {
    parts.push(`【当前全文纯文本】\n${input.documentText.trim().slice(0, 12000)}`)
  }
  if (input.documentHtml?.trim()) {
    parts.push(`【当前全文 HTML 摘要】\n${input.documentHtml.replace(/<[^>]+>/g, ' ').slice(0, 4000)}`)
  }
  if (input.knowledgeBaseIds?.length) {
    parts.push(`【知识库 ID】${input.knowledgeBaseIds.join(', ')}`)
  }
  if (input.fileIds?.length) {
    parts.push(`【资料文件 ID】${input.fileIds.join(', ')}`)
  }
  return parts.join('\n\n')
}

async function fallbackPatch(input: EditDocumentInput): Promise<WebDocumentPatchJson> {
  const type = mapModeToPatchType(input.mode)
  const instruction = input.instruction.trim()

  if (input.mode === 'rewrite_selection' && input.selectedText?.trim()) {
    const html = `<p>${escapeHtml(input.selectedText)}</p>`
    return { type, html, markdown: input.selectedText }
  }

  if (input.mode === 'insert_at_cursor') {
    const html = `<p>${escapeHtml(instruction)}</p>`
    return { type, html, markdown: instruction }
  }

  const title = input.title?.trim() || '办公文稿'
  try {
    const { content } = await generateDocumentContentDetailed({
      title,
      prompt: [instruction, input.documentText?.trim()].filter(Boolean).join('\n\n'),
    })
    const html = contentToHtml(content, {})
    const markdown = contentToMarkdown(content)
    return { type: 'replace_document', html, markdown }
  } catch {
    return {
      type: 'replace_document',
      html: `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(instruction)}</p>`,
      markdown: `# ${title}\n\n${instruction}`,
    }
  }
}

export async function runEditDocumentSkill(input: EditDocumentInput): Promise<EditDocumentResult> {
  const instruction = String(input.instruction || '').trim()
  if (!instruction) {
    return { success: false, error: '请输入编辑指令' }
  }

  const patchType = mapModeToPatchType(input.mode)

  if (!isLlmConfigured()) {
    const patch = await fallbackPatch(input)
    return { success: true, data: { patch } }
  }

  try {
    const raw = await invokeLlmJson<LlmEditJson>(
      [
        { role: 'system', content: buildSystemPrompt(input.mode) },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      { temperature: 0.35, maxTokens: 4096 },
    )

    let html = sectionsToHtml(raw)
    if (!html) {
      if (input.mode === 'replace_document' || input.mode === 'polish_document') {
        const patch = await fallbackPatch(input)
        return { success: true, data: { patch } }
      }
      const fb = await fallbackPatch(input)
      html = fb.html
    }

    const markdown =
      typeof raw.markdown === 'string' && raw.markdown.trim()
        ? raw.markdown.trim()
        : html.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

    return {
      success: true,
      data: {
        patch: {
          type: patchType,
          html,
          markdown,
        },
      },
    }
  } catch {
    const patch = await fallbackPatch(input)
    return { success: true, data: { patch } }
  }
}
