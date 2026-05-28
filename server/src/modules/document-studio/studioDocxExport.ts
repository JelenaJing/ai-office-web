import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx'
import fs from 'fs'
import {
  documentJsonFromEditor,
  type StudioDocumentJson,
  type DocumentBlock,
} from './editorJsonUtils'

const HEADING_COLOR = '2E74B5'
const BODY_SIZE = 24 // half-points → 12pt

type ProseNode = {
  type?: string
  text?: string
  marks?: Array<{ type?: string }>
  attrs?: { level?: number }
  content?: ProseNode[]
}

function hasMark(marks: Array<{ type?: string }> | undefined, name: string): boolean {
  return Boolean(marks?.some(m => m.type === name))
}

function collectPlainText(nodes: ProseNode[] | undefined): string {
  const parts: string[] = []
  const walk = (list?: ProseNode[]) => {
    for (const n of list || []) {
      if (n.type === 'text' && typeof n.text === 'string') parts.push(n.text)
      else if (n.content?.length) walk(n.content)
    }
  }
  walk(nodes)
  return parts.join('')
}

function inlineToTextRuns(nodes: ProseNode[] | undefined): TextRun[] {
  if (!nodes?.length) return [new TextRun({ text: '', size: BODY_SIZE })]
  const runs: TextRun[] = []
  for (const node of nodes) {
    if (node.type === 'text' && typeof node.text === 'string') {
      runs.push(
        new TextRun({
          text: node.text,
          size: BODY_SIZE,
          bold: hasMark(node.marks, 'bold'),
          italics: hasMark(node.marks, 'italic') || hasMark(node.marks, 'em'),
        }),
      )
    } else if (node.type === 'hardBreak') {
      runs.push(new TextRun({ text: '', break: 1 }))
    } else if (node.content?.length) {
      runs.push(...inlineToTextRuns(node.content))
    }
  }
  return runs.length ? runs : [new TextRun({ text: '', size: BODY_SIZE })]
}

function paragraphFromInline(nodes: ProseNode[] | undefined, options?: { spacing?: { before?: number; after?: number } }): Paragraph {
  return new Paragraph({
    children: inlineToTextRuns(nodes),
    spacing: options?.spacing ?? { after: 200 },
  })
}

function headingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  const map = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  } as const
  return map[Math.min(6, Math.max(1, level)) as 1] ?? HeadingLevel.HEADING_2
}

function paragraphsFromEditorJson(editorJson: Record<string, unknown>): Paragraph[] {
  const children: Paragraph[] = []
  const content = Array.isArray(editorJson.content) ? (editorJson.content as ProseNode[]) : []

  for (const node of content) {
    if (!node?.type) continue
    if (node.type === 'heading') {
      const level = node.attrs?.level ?? 2
      children.push(
        new Paragraph({
          children: inlineToTextRuns(node.content),
          heading: headingLevel(level),
          spacing: { before: level === 1 ? 240 : 200, after: level === 1 ? 200 : 160 },
        }),
      )
      continue
    }
    if (node.type === 'paragraph') {
      children.push(paragraphFromInline(node.content))
      continue
    }
    if (node.type === 'blockquote') {
      const inner = node.content?.[0]
      const quoteText = collectPlainText(inner?.content) || collectPlainText(node.content)
      children.push(
        new Paragraph({
          children: [new TextRun({ text: quoteText, italics: true, size: BODY_SIZE, color: '475569' })],
          indent: { left: 720 },
          spacing: { before: 120, after: 120 },
        }),
      )
      continue
    }
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      for (const li of node.content || []) {
        if (li.type !== 'listItem') continue
        const para = li.content?.find(c => c.type === 'paragraph')
        children.push(
          new Paragraph({
            children: inlineToTextRuns(para?.content),
            bullet: { level: 0 },
            spacing: { after: 80 },
          }),
        )
      }
      continue
    }
  }
  return children
}

function paragraphsFromBlocks(blocks: DocumentBlock[]): Paragraph[] {
  const children: Paragraph[] = []
  for (const block of blocks) {
    if (block.type === 'heading') {
      const level = Math.min(6, Math.max(1, block.level ?? 2))
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: block.text,
              bold: true,
              size: level === 1 ? 32 : 26,
              color: level === 1 ? undefined : HEADING_COLOR,
            }),
          ],
          heading: headingLevel(level),
          spacing: { before: 200, after: 160 },
        }),
      )
    } else if (block.type === 'blockquote') {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: block.text, italics: true, size: BODY_SIZE, color: '475569' })],
          indent: { left: 720 },
          spacing: { after: 120 },
        }),
      )
    } else if (block.type === 'list' && block.items?.length) {
      for (const item of block.items) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: item, size: BODY_SIZE })],
            bullet: { level: 0 },
            spacing: { after: 80 },
          }),
        )
      }
    } else if (block.text?.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: block.text, size: BODY_SIZE })],
          spacing: { after: 200 },
        }),
      )
    }
  }
  return children
}

function paragraphsFromMarkdown(md: string): Paragraph[] {
  const lines = md.split('\n')
  const children: Paragraph[] = []
  for (const raw of lines) {
    const line = raw.trimEnd()
    const t = line.trim()
    if (!t) continue
    if (t.startsWith('# ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: t.slice(2), bold: true, size: 32 })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
      )
    } else if (t.startsWith('## ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: t.slice(3), bold: true, size: 26, color: HEADING_COLOR })],
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 160 },
        }),
      )
    } else if (t.startsWith('### ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: t.slice(4), bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 140 },
        }),
      )
    } else if (/^[-*]\s+/.test(t)) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: t.replace(/^[-*]\s+/, ''), size: BODY_SIZE })],
          bullet: { level: 0 },
          spacing: { after: 80 },
        }),
      )
    } else if (t.startsWith('> ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: t.slice(2), italics: true, size: BODY_SIZE })],
          indent: { left: 720 },
          spacing: { after: 120 },
        }),
      )
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: t, size: BODY_SIZE })],
          spacing: { after: 200 },
        }),
      )
    }
  }
  return children
}

/** 将纯文本 / Markdown 导出为 DOCX（用于 AI 改写结果下载，非高保真 Word）。 */
export async function buildDocxBufferFromPlainText(title: string, text: string): Promise<Buffer> {
  const body = paragraphsFromMarkdown(text)
  const titleText = title.trim() || '改写文稿'
  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: titleText, bold: true, size: 36 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
    }),
    ...body,
  ]
  if (!body.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: text.trim() || '（内容为空）', size: BODY_SIZE })],
        spacing: { after: 200 },
      }),
    )
  }
  const doc = new Document({ sections: [{ children }] })
  return Packer.toBuffer(doc)
}

export async function buildStudioDocxBuffer(input: {
  title: string
  documentType: string
  documentId: string
  editorJson?: Record<string, unknown>
  contentModel?: StudioDocumentJson
  markdownPath?: string
}): Promise<Buffer> {
  let body: Paragraph[] = []

  if (input.editorJson?.type === 'doc' && Array.isArray(input.editorJson.content)) {
    body = paragraphsFromEditorJson(input.editorJson)
  }

  if (!body.length && input.contentModel?.blocks?.length) {
    body = paragraphsFromBlocks(input.contentModel.blocks)
  }

  if (!body.length && input.editorJson) {
    const derived = documentJsonFromEditor(
      input.documentId,
      input.documentType,
      input.title,
      input.editorJson,
    )
    body = paragraphsFromBlocks(derived.blocks)
  }

  if (!body.length && input.markdownPath && fs.existsSync(input.markdownPath)) {
    body = paragraphsFromMarkdown(fs.readFileSync(input.markdownPath, 'utf-8'))
  }

  const titleText = input.title?.trim() || '未命名文稿'
  const hasTitleHeading = body.some(p => {
    const h = (p as { heading?: string }).heading
    return h === HeadingLevel.HEADING_1 || h === 'Heading1'
  })

  const children: Paragraph[] = []
  if (!hasTitleHeading) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: titleText, bold: true, size: 36 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 320 },
      }),
    )
  }
  children.push(...body)

  if (!children.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '（文稿内容为空）', size: BODY_SIZE, color: '64748b' })],
      }),
    )
  }

  const doc = new Document({
    sections: [{ children }],
  })
  return Packer.toBuffer(doc)
}
