import type { WebDeckDocument, WebDeckSlide } from '../types'

interface ParsedFallbackSlide {
  title: string
  body: string[]
}

function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizeInlineSvg(svg: string): string {
  return String(svg || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '')
}

function stripLeadingFrontmatter(markdown: string): string {
  return String(markdown || '').trim().replace(/^---\n[\s\S]*?\n---\n?/, '').trim()
}

function extractSlideChunks(markdown: string): string[] {
  const content = String(markdown || '').trim()
  if (!content) return []
  const withoutGlobalFrontmatter = stripLeadingFrontmatter(content)
  const officialChunks = Array.from(
    withoutGlobalFrontmatter.matchAll(/(?:^|\n)---\n[\s\S]*?\n---\n([\s\S]*?)(?=\n---\n[\s\S]*?\n---\n|$)/g),
  )
    .map((match) => match[1].trim())
    .filter(Boolean)
  if (officialChunks.length > 0) return officialChunks
  return withoutGlobalFrontmatter.split(/\n---\n/g).map((chunk) => stripLeadingFrontmatter(chunk)).filter(Boolean)
}

function normalizeLines(markdown: string): ParsedFallbackSlide[] {
  const chunks = extractSlideChunks(markdown)
  if (chunks.length === 0) return [{ title: '演示文稿', body: [] }]
  return chunks.map((chunk) => {
    const lines = chunk
      .replace(/<!--[\s\S]*?-->/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const heading = lines.find((line) => /^#+\s+/.test(line))
    return {
      title: heading ? heading.replace(/^#+\s+/, '') : '演示页面',
      body: lines.filter((line) => line !== heading),
    }
  })
}

function renderFallbackMarkdownBody(lines: string[]): string {
  if (lines.length === 0) {
    return '<div class="slide-copy"><p>暂无内容，等待生成结构化演示内容。</p></div>'
  }
  const blocks: string[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (/^- /.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^- /.test(lines[index])) {
        items.push(lines[index].replace(/^- /, ''))
        index += 1
      }
      blocks.push(`<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)
      continue
    }
    if (/^```/.test(line)) {
      const language = line.replace(/^```/, '').trim() || 'text'
      index += 1
      const code: string[] = []
      while (index < lines.length && !/^```/.test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      index += 1
      blocks.push(`<pre data-code-language="${escapeHtml(language)}"><code>${escapeHtml(code.join('\n'))}</code></pre>`)
      continue
    }
    if (/^\|/.test(line) && index + 1 < lines.length && /^\|[-: |]+\|?$/.test(lines[index + 1])) {
      const rows: string[][] = []
      while (index < lines.length && /^\|/.test(lines[index])) {
        rows.push(lines[index].split('|').map((cell) => cell.trim()).filter(Boolean))
        index += 1
      }
      const [headers, , ...dataRows] = rows
      blocks.push(`<table><thead><tr>${(headers || []).map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${dataRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`)
      continue
    }
    if (/^> /.test(line)) {
      blocks.push(`<blockquote>${escapeHtml(line.replace(/^> /, ''))}</blockquote>`)
      index += 1
      continue
    }
    blocks.push(`<p>${escapeHtml(line)}</p>`)
    index += 1
  }
  return `<div class="slide-copy">${blocks.join('')}</div>`
}

function renderImageVisual(slide: WebDeckSlide): string | null {
  if (!slide.visual?.imageUrl) return null
  return `<div class="slidev-visual slidev-visual-image" data-slidev-visual="image">
    <img src="${escapeHtml(slide.visual.imageUrl)}" alt="${escapeHtml(slide.visual.alt || slide.visual.title || slide.title)}" />
    ${slide.visual.description ? `<div class="visual-caption">${escapeHtml(slide.visual.description)}</div>` : ''}
  </div>`
}

function renderSvgVisual(slide: WebDeckSlide): string | null {
  if (!slide.visual?.svg) return null
  return `<div class="slidev-visual slidev-visual-svg" data-slidev-visual="${escapeHtml(slide.visual.type || 'svg')}">
    ${sanitizeInlineSvg(slide.visual.svg)}
  </div>`
}

function renderPlaceholderVisual(slide: WebDeckSlide): string {
  const items = (slide.items || []).slice(0, 3)
  return `<div class="slidev-visual slidev-visual-placeholder" data-slidev-visual="${escapeHtml(slide.visual?.type || 'placeholder')}">
    <div class="placeholder-orb placeholder-orb-a"></div>
    <div class="placeholder-orb placeholder-orb-b"></div>
    <div class="placeholder-panel">
      <span class="placeholder-kicker">${escapeHtml(slide.visual?.title || slide.type || 'Visual')}</span>
      <strong>${escapeHtml(slide.title)}</strong>
      <p>${escapeHtml(slide.visual?.description || slide.subtitle || items[0] || '结构化视觉预览')}</p>
    </div>
  </div>`
}

function renderVisual(slide: WebDeckSlide): string {
  return renderImageVisual(slide) || renderSvgVisual(slide) || renderPlaceholderVisual(slide)
}

function renderBullets(items: string[]): string {
  if (!items.length) return ''
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function renderTable(slide: WebDeckSlide): string {
  const table = slide.table
  if (!table) return ''
  return `<div class="data-table-shell">
    <table>
      <thead><tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>`
}

function renderTimeline(slide: WebDeckSlide): string {
  const timeline = slide.timeline || slide.items.map((item, index) => ({ title: `阶段 ${index + 1}`, detail: item })).slice(0, 4)
  return `<div class="timeline-shell slidev-visual slidev-visual-diagram" data-slidev-visual="diagram">
    ${timeline.map((item, index) => `<div class="timeline-item">
      <span class="timeline-index">${index + 1}</span>
      <div class="timeline-card">
        <strong>${escapeHtml(item.title)}</strong>
        ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ''}
      </div>
    </div>`).join('')}
  </div>`
}

function renderCards(slide: WebDeckSlide): string {
  const items = (slide.items || []).slice(0, 4)
  return `<div class="cards-grid slidev-visual slidev-visual-cards" data-slidev-visual="cards">
    ${items.map((item, index) => `<div class="content-card">
      <span class="content-card-index">${index + 1}</span>
      <strong>${escapeHtml(item)}</strong>
    </div>`).join('')}
  </div>`
}

function renderCodeBlocks(slide: WebDeckSlide): string {
  const raw = slide.raw && typeof slide.raw === 'object' ? slide.raw : {}
  const blocks: Array<{ language: string; code: string }> = []
  const appendBlock = (value: unknown, language: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      blocks.push({ language: String(language || 'text'), code: value })
      return
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>
      const code = typeof record.code === 'string' ? record.code : typeof record.content === 'string' ? record.content : ''
      if (code.trim()) {
        blocks.push({ language: String(record.language || record.lang || language || 'text'), code })
      }
    }
  }
  appendBlock(raw.code, raw.language)
  appendBlock(raw.codeBlock, raw.language)
  appendBlock(raw.mermaid, 'mermaid')
  if (!blocks.length) return ''
  return `<div class="code-grid">${blocks.map((block) => `<pre data-code-language="${escapeHtml(block.language)}"><code>${escapeHtml(block.code)}</code></pre>`).join('')}</div>`
}

function renderSpeakerNotes(slide: WebDeckSlide): string {
  const notes = slide.speakerNotes || slide.notes
  if (!notes) return ''
  return `<div class="speaker-notes">讲稿备注：${escapeHtml(notes)}</div>`
}

function renderSlideContent(slide: WebDeckSlide): string {
  if (slide.type === 'cover') {
    return `<div class="cover-layout">
      <div class="cover-copy">
        <span class="slide-kicker">网页演示 Slidev</span>
        <h1>${escapeHtml(slide.title)}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
        ${renderBullets((slide.items || []).slice(0, 3))}
      </div>
      <div class="cover-visual">${renderVisual(slide)}</div>
    </div>`
  }

  if (slide.type === 'toc') {
    return `<div class="toc-layout">
      <div class="toc-copy">
        <span class="slide-kicker">目录</span>
        <h1>${escapeHtml(slide.title)}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
      </div>
      ${renderCards(slide)}
    </div>`
  }

  if (slide.layout === 'timeline') {
    return `<div class="content-layout content-layout-full">
      <div class="content-copy">
        <span class="slide-kicker">时间线</span>
        <h1>${escapeHtml(slide.title)}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
      </div>
      ${renderTimeline(slide)}
      <div class="content-inline-visual">${renderVisual(slide)}</div>
    </div>`
  }

  if (slide.layout === 'comparison' || slide.layout === 'table' || slide.table) {
    return `<div class="content-layout">
      <div class="content-copy">
        <span class="slide-kicker">数据与对比</span>
        <h1>${escapeHtml(slide.title)}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
        ${renderTable(slide)}
      </div>
      <div class="content-side">${renderVisual(slide)}</div>
    </div>`
  }

  if (slide.layout === 'cards' || slide.type === 'summary') {
    return `<div class="content-layout content-layout-full">
      <div class="content-copy">
        <span class="slide-kicker">重点总结</span>
        <h1>${escapeHtml(slide.title)}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
      </div>
      ${renderCards(slide)}
      <div class="content-inline-visual">${renderVisual(slide)}</div>
    </div>`
  }

  if (slide.quote) {
    return `<div class="quote-layout">
      <div class="quote-card">
        <span class="quote-mark">“</span>
        <p>${escapeHtml(slide.quote.text)}</p>
        ${slide.quote.author ? `<span class="quote-author">— ${escapeHtml(slide.quote.author)}</span>` : ''}
      </div>
      <div class="content-side">${renderVisual(slide)}</div>
    </div>`
  }

  if (slide.layout === 'section-divider' || slide.type === 'section') {
    return `<div class="section-layout">
      <div class="section-copy">
        <span class="slide-kicker">章节过渡</span>
        <h1>${escapeHtml(slide.title)}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
      </div>
      <div class="section-visual">${renderVisual(slide)}</div>
    </div>`
  }

  return `<div class="content-layout">
    <div class="content-copy">
      <span class="slide-kicker">${escapeHtml(slide.layout === 'two-column' ? '图文排版' : '核心内容')}</span>
      <h1>${escapeHtml(slide.title)}</h1>
      ${slide.subtitle ? `<p class="slide-subtitle">${escapeHtml(slide.subtitle)}</p>` : ''}
      ${renderBullets(slide.items || [])}
      ${renderCodeBlocks(slide)}
    </div>
    <div class="content-side">${renderVisual(slide)}</div>
  </div>`
}

function renderDeckSlide(slide: WebDeckSlide, index: number, total: number): string {
  return `<section class="slide" id="slide-${index + 1}" data-slide-index="${index}" data-slide-id="${escapeHtml(slide.id)}">
    <div class="slide-surface">
      <div class="slide-main">
        ${renderSlideContent(slide)}
      </div>
      ${renderSpeakerNotes(slide)}
      <div class="slide-footer">
        <span>${index + 1} / ${total}</span>
        <span>${escapeHtml(slide.type)}</span>
      </div>
    </div>
  </section>`
}

function renderFallbackSlide(slide: ParsedFallbackSlide, index: number, total: number): string {
  return `<section class="slide" id="slide-${index + 1}" data-slide-index="${index}">
    <div class="slide-surface">
      <div class="slide-main">
        <div class="content-layout">
          <div class="content-copy">
            <span class="slide-kicker">Markdown Preview</span>
            <h1>${escapeHtml(slide.title)}</h1>
            ${renderFallbackMarkdownBody(slide.body)}
          </div>
          <div class="content-side">
            <div class="slidev-visual slidev-visual-placeholder" data-slidev-visual="placeholder">
              <div class="placeholder-orb placeholder-orb-a"></div>
              <div class="placeholder-orb placeholder-orb-b"></div>
              <div class="placeholder-panel">
                <span class="placeholder-kicker">Preview</span>
                <strong>${escapeHtml(slide.title)}</strong>
                <p>当前使用 Markdown fallback 进行安全预览。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="slide-footer">
        <span>${index + 1} / ${total}</span>
        <span>fallback</span>
      </div>
    </div>
  </section>`
}

export function generateSlidevHtmlPreview(input: {
  title: string
  slidevMarkdown: string
  deck?: WebDeckDocument
}): string {
  const { title, slidevMarkdown, deck } = input
  const slideHtml = deck?.slides?.length
    ? deck.slides.map((slide, index) => renderDeckSlide(slide, index, deck.slides.length)).join('\n')
    : (() => {
        const slides = normalizeLines(slidevMarkdown)
        return slides.map((slide, index) => renderFallbackSlide(slide, index, slides.length)).join('\n')
      })()

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<title>${escapeHtml(title || 'Slidev Preview')}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
    color: #dbeafe;
    background:
      radial-gradient(circle at top, rgba(59,130,246,0.22), transparent 34%),
      linear-gradient(180deg, #06111f 0%, #09172b 58%, #06101c 100%);
    min-height: 100vh;
    padding: 24px 16px 40px;
  }
  .preview-shell {
    max-width: 1260px;
    margin: 0 auto;
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .slides {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .slide {
    width: 100%;
    display: none;
    justify-content: center;
  }
  .slide:first-child {
    display: flex;
  }
  .slides:has(.slide:target) .slide:first-child {
    display: none;
  }
  .slide:target {
    display: flex;
  }
  body.ppt-selection-active * {
    cursor: crosshair !important;
  }
  .ppt-select-highlight {
    outline: 2px solid #2563eb !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.18);
  }
  .slide-surface {
    width: min(100%, 1180px);
    aspect-ratio: 16 / 9;
    border-radius: 26px;
    overflow: hidden;
    position: relative;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.98) 100%);
    box-shadow:
      0 30px 80px rgba(3, 7, 18, 0.42),
      inset 0 1px 0 rgba(255,255,255,0.72);
    color: #0f172a;
  }
  .slide-main {
    height: 100%;
    padding: 42px 44px 56px;
    display: flex;
    flex-direction: column;
  }
  .slide-footer {
    position: absolute;
    right: 24px;
    bottom: 18px;
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 12px;
    color: rgba(15, 23, 42, 0.62);
  }
  .slide-kicker,
  .placeholder-kicker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  h1 {
    margin: 0;
    font-size: clamp(30px, 3.2vw, 46px);
    line-height: 1.08;
    color: #0f172a;
  }
  .slide-subtitle,
  .content-copy p,
  .quote-card p,
  .placeholder-panel p,
  .speaker-notes {
    color: #334155;
    line-height: 1.6;
    font-size: clamp(15px, 1.4vw, 18px);
  }
  .speaker-notes {
    position: absolute;
    left: 24px;
    bottom: 18px;
    max-width: 55%;
    padding: 8px 12px;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.06);
    font-size: 12px;
    color: rgba(15, 23, 42, 0.72);
  }
  .cover-layout,
  .content-layout,
  .quote-layout,
  .section-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
    gap: 28px;
    align-items: stretch;
    height: 100%;
  }
  .content-layout-full,
  .toc-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 100%;
  }
  .cover-copy,
  .toc-copy,
  .content-copy,
  .section-copy {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .cover-copy ul,
  .content-copy ul {
    margin: 0;
    padding-left: 20px;
    display: grid;
    gap: 10px;
    color: #1e293b;
    font-size: clamp(16px, 1.45vw, 19px);
  }
  .cover-visual,
  .content-side,
  .section-visual,
  .content-inline-visual {
    min-height: 0;
    display: flex;
  }
  .content-inline-visual {
    flex: 1;
    min-height: 180px;
  }
  .slidev-visual {
    width: 100%;
    height: 100%;
    min-height: 220px;
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    background:
      linear-gradient(145deg, rgba(37,99,235,0.12), rgba(14,165,233,0.08)),
      linear-gradient(180deg, rgba(255,255,255,0.92), rgba(241,245,249,0.96));
    border: 1px solid rgba(148, 163, 184, 0.24);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.72);
  }
  .slidev-visual img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .visual-caption {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 16px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.72);
    color: #eff6ff;
    font-size: 13px;
  }
  .slidev-visual svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .slidev-visual-placeholder {
    padding: 24px;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
  }
  .placeholder-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(8px);
    opacity: 0.8;
  }
  .placeholder-orb-a {
    top: 28px;
    right: 32px;
    width: 124px;
    height: 124px;
    background: rgba(56, 189, 248, 0.28);
  }
  .placeholder-orb-b {
    bottom: 42px;
    left: 28px;
    width: 156px;
    height: 156px;
    background: rgba(99, 102, 241, 0.18);
  }
  .placeholder-panel {
    position: relative;
    z-index: 1;
    width: min(80%, 360px);
    padding: 20px 22px;
    border-radius: 20px;
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(16px);
    display: grid;
    gap: 10px;
  }
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .content-card,
  .slidev-card-item {
    min-height: 112px;
    border-radius: 20px;
    padding: 18px;
    background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(226,232,240,0.95));
    border: 1px solid rgba(96,165,250,0.22);
    box-shadow: 0 14px 34px rgba(37, 99, 235, 0.08);
    display: grid;
    gap: 12px;
    align-content: start;
  }
  .content-card-index,
  .slidev-card-index,
  .timeline-index {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #2563eb, #38bdf8);
    color: #eff6ff;
    font-size: 13px;
    font-weight: 800;
  }
  .timeline-shell {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
  }
  .timeline-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: start;
  }
  .timeline-card {
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(125, 211, 252, 0.34);
    box-shadow: 0 10px 30px rgba(14, 165, 233, 0.08);
  }
  .timeline-card p {
    margin: 8px 0 0;
    font-size: 14px;
  }
  .quote-layout {
    align-items: center;
  }
  .quote-card {
    border-radius: 28px;
    padding: 34px;
    background: linear-gradient(180deg, rgba(15,23,42,0.96), rgba(30,41,59,0.96));
    color: #eff6ff;
    position: relative;
    min-height: 280px;
    display: grid;
    align-content: center;
    gap: 16px;
  }
  .quote-mark {
    font-size: 88px;
    line-height: 0.8;
    color: rgba(147, 197, 253, 0.48);
  }
  .quote-card p,
  .quote-author {
    color: #eff6ff;
  }
  .data-table-shell table,
  .slide-copy table,
  .slidev-visual-chart table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    background: rgba(255,255,255,0.8);
    overflow: hidden;
    border-radius: 16px;
  }
  th, td {
    border: 1px solid rgba(148, 163, 184, 0.25);
    padding: 10px 12px;
    text-align: left;
  }
  th {
    background: rgba(191, 219, 254, 0.34);
  }
  .code-grid,
  .slide-copy {
    display: grid;
    gap: 14px;
  }
  pre {
    margin: 0;
    padding: 16px;
    border-radius: 18px;
    background: #0f172a;
    color: #e2e8f0;
    overflow: auto;
    font-size: 13px;
  }
  blockquote {
    margin: 0;
    padding: 18px 20px;
    border-radius: 18px;
    border-left: 4px solid #2563eb;
    background: rgba(219, 234, 254, 0.46);
  }
  @media (max-width: 900px) {
    body { padding: 16px 10px 24px; }
    .slide-surface { border-radius: 18px; }
    .slide-main { padding: 24px 22px 48px; }
    .cover-layout,
    .content-layout,
    .quote-layout,
    .section-layout {
      grid-template-columns: 1fr;
    }
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
</head>
<body>
  <div class="preview-shell">
    <main class="slides">
      ${slideHtml}
    </main>
  </div>
</body>
</html>`
}
