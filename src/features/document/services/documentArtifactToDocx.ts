/**
 * documentArtifactToDocx
 *
 * Converts a DocumentArtifact (html + canonicalData.blocks) into a DOCX Blob
 * suitable for browser-side download, using html-docx-js.
 *
 * This is the client-side fallback export path for documents that do not have
 * a server-side documentId.  When documentId is available the server-side
 * exportDocumentArtifact API should be preferred (it produces higher-quality
 * output), but this path ensures "Export Word" always works even for freshly
 * typed, not-yet-saved documents.
 *
 * ── Why public/html-docx.js? ──────────────────────────────────────────────────
 *
 * html-docx-js v0.3.1 ships a UMD bundle that contains legacy JavaScript `with`
 * statements (used by an embedded CoffeeScript-compiled template engine).
 * Rollup's Rust-based AST parser (used by Vite 5) cannot parse `with` statements,
 * so importing html-docx-js directly via `import` or `require()` causes the Vite
 * production build to fail with "Cannot convert Stmt::With".
 *
 * Workaround: the UMD bundle is served as a static asset at /html-docx.js
 * and injected at runtime via a <script> tag.  The UMD bundle registers itself
 * as window.htmlDocx once loaded.  We cache the reference to avoid repeated
 * script injection.
 *
 * ── License ──────────────────────────────────────────────────────────────────
 *
 * html-docx-js is licensed under the MIT License.
 * Copyright (c) 2014 Evidence Prime, Artur Nowak.
 * See node_modules/html-docx-js/LICENSE for the full text.
 * public/html-docx.js is a verbatim copy of node_modules/html-docx-js/dist/html-docx.js.
 *
 * ── Future migration path ─────────────────────────────────────────────────────
 *
 * The preferred long-term approach is to move DOCX generation to the server:
 *   POST /api/documents/export-docx  { artifact: DocumentArtifact }
 * The server can use docx (npm) or the existing OOXML pipeline (documentEngineService)
 * which already produces production-quality DOCX files.  The client-side path here
 * is intentionally minimal and serves as a no-server-dependency fallback only.
 */

import type { DocumentArtifact, DocumentCanonicalBlock } from './documentWorkbenchApi'
type HtmlDocxLib = { asBlob: (html: string, opts?: Record<string, unknown>) => Blob }

let htmlDocxCache: HtmlDocxLib | null = null

function loadHtmlDocx(): Promise<HtmlDocxLib> {
  // Return cached instance if already loaded
  if (htmlDocxCache) return Promise.resolve(htmlDocxCache)
  // If already available on window (e.g., script already injected)
  const w = window as unknown as { htmlDocx?: HtmlDocxLib }
  if (w.htmlDocx?.asBlob) {
    htmlDocxCache = w.htmlDocx
    return Promise.resolve(htmlDocxCache)
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/html-docx.js'
    script.onload = () => {
      const lib = (window as unknown as { htmlDocx?: HtmlDocxLib }).htmlDocx
      if (!lib?.asBlob) {
        reject(new Error('html-docx-js 加载失败：未找到 asBlob 方法'))
        return
      }
      htmlDocxCache = lib
      resolve(lib)
    }
    script.onerror = () => reject(new Error('无法加载 html-docx-js：/html-docx.js 未找到'))
    document.head.appendChild(script)
  })
}

// ─── block → DOCX-friendly HTML ──────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function citationInlineText(citationIds: string[] | undefined, allCitationLabels: Map<string, string>): string {
  if (!citationIds?.length) return ''
  return citationIds
    .map((id) => {
      const label = allCitationLabels.get(id)
      return label ? `<sup>[${escapeHtml(label)}]</sup>` : ''
    })
    .filter(Boolean)
    .join('')
}

function blockToDocxHtml(block: DocumentCanonicalBlock, citationLabels: Map<string, string>): string {
  const cites = citationInlineText(block.citationIds, citationLabels)

  switch (block.type) {
    case 'title':
      return `<h1>${escapeHtml(block.text)}${cites}</h1>`

    case 'heading': {
      const level = Math.max(1, Math.min(6, block.level ?? 2))
      return `<h${level}>${escapeHtml(block.text)}${cites}</h${level}>`
    }

    case 'paragraph':
      return `<p>${escapeHtml(block.text)}${cites}</p>`

    case 'quote':
      return `<blockquote><p>${escapeHtml(block.text)}${cites}</p></blockquote>`

    case 'list-item': {
      const tag = block.listKind === 'numbered' ? 'ol' : 'ul'
      return `<${tag}><li>${escapeHtml(block.text)}${cites}</li></${tag}>`
    }

    case 'table': {
      const headerRow = block.headers.length
        ? `<tr>${block.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
        : ''
      const bodyRows = block.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('')
      const caption = block.title ? `<caption>${escapeHtml(block.title)}</caption>` : ''
      return `<table border="1" cellpadding="4" cellspacing="0">${caption}<tbody>${headerRow}${bodyRows}</tbody></table>`
    }

    case 'image':
      // Images cannot be reliably embedded into DOCX via html-docx-js;
      // emit a descriptive placeholder instead.
      return `<p><em>[图片：${escapeHtml(block.alt || block.caption || '图片')}]</em></p>`

    case 'divider':
      return '<hr/>'

    default:
      return ''
  }
}

// ─── build the full Word-compatible HTML document ─────────────────────────────

function buildDocxHtmlDocument(artifact: DocumentArtifact): string {
  const { canonicalData, citations } = artifact

  // Build citation id → label lookup
  const citationLabels = new Map<string, string>()
  for (const c of citations ?? []) {
    citationLabels.set(c.id, c.label ?? c.id)
  }

  const bodyHtml = (canonicalData?.blocks ?? [])
    .map((block) => blockToDocxHtml(block, citationLabels))
    .join('\n')

  // References section at the end (if any)
  const refs = artifact.references ?? []
  const refsHtml = refs.length
    ? [
        '<h2>参考文献</h2>',
        '<ol>',
        ...refs.map((r) => `<li>${escapeHtml(r.label ?? r.id)}</li>`),
        '</ol>',
      ].join('\n')
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(artifact.title || '文稿')}</title>
<style>
  body { font-family: "SimSun", "宋体", serif; font-size: 12pt; line-height: 1.8; }
  h1 { font-size: 18pt; text-align: center; font-weight: bold; margin: 24pt 0 12pt; }
  h2 { font-size: 14pt; font-weight: bold; margin: 18pt 0 9pt; }
  h3 { font-size: 13pt; font-weight: bold; margin: 14pt 0 7pt; }
  p { margin: 6pt 0; text-indent: 2em; }
  blockquote { margin: 6pt 24pt; color: #555; }
  table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
  th, td { border: 1px solid #999; padding: 4pt 6pt; }
  th { background: #f0f0f0; font-weight: bold; }
  caption { font-size: 10pt; color: #333; margin-bottom: 4pt; }
  ul, ol { margin: 6pt 0 6pt 24pt; }
  hr { border: none; border-top: 1px solid #ccc; margin: 12pt 0; }
  sup { font-size: 8pt; color: #0055aa; }
</style>
</head>
<body>
${bodyHtml}
${refsHtml}
</body>
</html>`
}

// ─── public API ───────────────────────────────────────────────────────────────

export { buildDocxHtmlDocument }

export interface DocxExportOptions {
  filename?: string
  /** Page margins in twips (1 inch = 1440 twips). Defaults to 1-inch margins. */
  margins?: { top?: number; bottom?: number; left?: number; right?: number }
}

/**
 * Convert a DocumentArtifact to a DOCX Blob in the browser using html-docx-js.
 * Returns a Blob so callers can trigger a download or upload as needed.
 */
export async function documentArtifactToDocxBlob(
  artifact: DocumentArtifact,
  options: DocxExportOptions = {},
): Promise<Blob> {
  const lib = await loadHtmlDocx()
  const htmlDoc = buildDocxHtmlDocument(artifact)
  const margins = {
    top: options.margins?.top ?? 1440,
    bottom: options.margins?.bottom ?? 1440,
    left: options.margins?.left ?? 1800,
    right: options.margins?.right ?? 1800,
  }
  return lib.asBlob(htmlDoc, { orientation: 'portrait', margins })
}

/**
 * Convert a DocumentArtifact to DOCX and immediately trigger a browser download.
 * Throws on failure so the caller can surface an error message to the user.
 */
export async function downloadDocxFromArtifact(
  artifact: DocumentArtifact,
  options: DocxExportOptions = {},
): Promise<void> {
  const blob = await documentArtifactToDocxBlob(artifact, options)
  const filename = options.filename || `${sanitizeFilename(artifact.title || '文稿')}.docx`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'document'
}
