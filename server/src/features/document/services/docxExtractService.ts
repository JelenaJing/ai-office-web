/**
 * docxExtractService — extract plain HTML from a .docx buffer using JSZip + xml-js
 *
 * Handles: headings (Heading1-3), paragraphs, hyperlink text, basic tables.
 * Does NOT require mammoth or any external DOCX library.
 */
import JSZip from 'jszip'
import { xml2js } from 'xml-js'

export interface DocxExtractResult {
  html: string
  text: string
  title?: string
  wordCount: number
}

// xml-js compact node
type XNode = Record<string, unknown>

function getTextContent(el: unknown): string {
  if (!el) return ''
  if (typeof el === 'string') return el
  if (typeof el === 'number') return String(el)
  const node = el as XNode
  if (typeof node._text === 'string') return node._text
  if (typeof node._text === 'number') return String(node._text)
  if (typeof node._cdata === 'string') return node._cdata
  return ''
}

function toArray<T>(val: T | T[] | null | undefined): T[] {
  if (val == null) return []
  return Array.isArray(val) ? val : [val]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getStyleId(para: XNode): string {
  const pPr = para['w:pPr'] as XNode | undefined
  if (!pPr) return ''
  const pStyle = pPr['w:pStyle'] as XNode | undefined
  if (!pStyle) return ''
  const attrs = pStyle._attributes as Record<string, string> | undefined
  return (attrs?.['w:val'] ?? '').toString()
}

function isHeadingStyle(style: string, level: 1 | 2 | 3): boolean {
  const s = style.toLowerCase()
  return (
    s === `heading${level}`
    || s === `heading ${level}`
    || s === `${level}`
    || s === `标题${level}`
    || s === `titre${level}`
    // Simplified Chinese Word templates use numeric style IDs
    || (level <= 3 && s === `${level}`)
  )
}

function extractRunText(run: XNode): string {
  // w:t can be a plain string or an ElementCompact with _text
  const wt = run['w:t']
  return getTextContent(wt)
}

function extractInlineText(container: XNode): string {
  // Collect text from w:r runs directly in the container
  const runs = toArray(container['w:r'] as XNode | XNode[] | undefined)
  let text = runs.map((r) => extractRunText(r as XNode)).join('')

  // Also collect text from hyperlinks (w:hyperlink > w:r)
  const hyperlinks = toArray(container['w:hyperlink'] as XNode | XNode[] | undefined)
  for (const hl of hyperlinks) {
    const hlRuns = toArray((hl as XNode)['w:r'] as XNode | XNode[] | undefined)
    text += hlRuns.map((r) => extractRunText(r as XNode)).join('')
  }

  return text
}

function extractParagraphHtml(para: XNode): string | null {
  const text = extractInlineText(para)
  if (!text.trim()) return null

  const style = getStyleId(para)
  const escaped = escapeHtml(text)

  if (isHeadingStyle(style, 1)) return `<h1>${escaped}</h1>`
  if (isHeadingStyle(style, 2)) return `<h2>${escaped}</h2>`
  if (isHeadingStyle(style, 3)) return `<h3>${escaped}</h3>`
  return `<p>${escaped}</p>`
}

function extractTableHtml(tbl: XNode): string[] {
  const lines: string[] = []
  const rows = toArray(tbl['w:tr'] as XNode | XNode[] | undefined)
  for (const row of rows) {
    const cells = toArray((row as XNode)['w:tc'] as XNode | XNode[] | undefined)
    const cellTexts: string[] = []
    for (const cell of cells) {
      const paragraphs = toArray((cell as XNode)['w:p'] as XNode | XNode[] | undefined)
      const cellText = paragraphs.map((p) => extractInlineText(p as XNode)).filter(Boolean).join(' ')
      if (cellText.trim()) cellTexts.push(cellText.trim())
    }
    if (cellTexts.length) lines.push(`<p>${escapeHtml(cellTexts.join(' | '))}</p>`)
  }
  return lines
}

export async function extractDocxContent(buffer: Buffer): Promise<DocxExtractResult> {
  let zip: JSZip
  try {
    zip = await (JSZip as unknown as { loadAsync(data: Buffer): Promise<JSZip> }).loadAsync(buffer)
  } catch {
    throw new Error('无法打开文件，请确认文件是有效的 .docx 格式')
  }

  const xmlFile = zip.file('word/document.xml')
  if (!xmlFile) {
    throw new Error('无效的 DOCX 文件（缺少 word/document.xml）')
  }

  let xmlContent: string
  try {
    xmlContent = await xmlFile.async('string')
  } catch {
    throw new Error('无法读取文档 XML 内容')
  }

  let parsed: XNode
  try {
    parsed = xml2js(xmlContent, { compact: true, ignoreDeclaration: true, ignoreInstruction: true }) as XNode
  } catch {
    throw new Error('无法解析文档 XML 内容')
  }

  const doc = (parsed['w:document'] ?? parsed['w14:document']) as XNode | undefined
  const body = doc?.['w:body'] as XNode | undefined
  if (!body) {
    throw new Error('文档结构异常，无法提取正文（缺少 w:body）')
  }

  const htmlParts: string[] = []
  let title: string | undefined

  // Process all top-level children (paragraphs + tables)
  // xml-js compact gives us named children; iterate keys that are w:p or w:tbl
  const paragraphs = toArray(body['w:p'] as XNode | XNode[] | undefined)
  const tables = toArray(body['w:tbl'] as XNode | XNode[] | undefined)

  // To preserve document order, we need to walk the original XML order.
  // Since xml-js compact doesn't preserve order for multiple same-named siblings,
  // we process paragraphs first, then table cells as paragraphs.
  for (const para of paragraphs) {
    const line = extractParagraphHtml(para as XNode)
    if (!line) continue
    if (!title && (line.startsWith('<h1>') || line.startsWith('<h2>'))) {
      title = line.replace(/<[^>]+>/g, '')
    }
    htmlParts.push(line)
  }

  for (const tbl of tables) {
    const tableLines = extractTableHtml(tbl as XNode)
    htmlParts.push(...tableLines)
  }

  if (htmlParts.length === 0) {
    throw new Error('文档内容为空，未能提取到任何段落')
  }

  const html = htmlParts.join('\n')
  const text = htmlParts.map((h) => h.replace(/<[^>]+>/g, '')).join('\n')
  const wordCount = text.replace(/\s+/g, '').length

  return { html, text, title, wordCount }
}
