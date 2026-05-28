import { wrapDocumentBodyHtml } from '../../document/services/documentContentApply'

type StudioBlock = {
  id: string
  type: 'heading' | 'paragraph' | 'blockquote' | 'list'
  level?: number
  text: string
  items?: string[]
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function blockToHtml(block: StudioBlock): string {
  if (block.type === 'heading') {
    const level = Math.min(3, Math.max(2, block.level ?? 2))
    const tag = level === 3 ? 'h3' : 'h2'
    return `<${tag} data-block-id="${block.id}" data-section-heading="true" data-role="heading">${escapeHtml(block.text)}</${tag}>`
  }
  if (block.type === 'blockquote') {
    return `<blockquote data-block-id="${block.id}" data-block-type="quote" data-role="quote"><p>${escapeHtml(block.text)}</p></blockquote>`
  }
  if (block.type === 'list' && block.items?.length) {
    const lis = block.items.map((item, i) =>
      `<li data-block-id="${block.id}-li-${i + 1}">${escapeHtml(item)}</li>`,
    ).join('')
    return `<ul data-block-id="${block.id}" data-role="list">${lis}</ul>`
  }
  return `<p data-block-id="${block.id}" data-role="paragraph">${escapeHtml(block.text)}</p>`
}

/** 将 Studio contentModel.blocks 转为 Workbench 可编辑 HTML */
export function studioContentModelToWorkbenchHtml(input: {
  title: string
  blocks?: StudioBlock[]
}): string {
  const title = String(input.title || '未命名文稿').trim() || '未命名文稿'
  const blocks = Array.isArray(input.blocks) ? input.blocks : []
  const bodyParts: string[] = []
  let skippedTitle = false

  for (const block of blocks) {
    if (!skippedTitle && block.type === 'heading' && (block.level ?? 1) <= 1) {
      skippedTitle = true
      continue
    }
    bodyParts.push(blockToHtml(block))
  }

  const bodyHtml = bodyParts.join('\n') || '<p data-block-id="body-paragraph-1" data-role="paragraph"><br /></p>'
  return wrapDocumentBodyHtml(title, bodyHtml)
}
