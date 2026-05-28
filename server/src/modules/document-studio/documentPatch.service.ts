import type { DocumentPatchResult } from '../capabilities/capability.types'
import { updateStudioEditorJson, loadStudioDocument } from './documentArtifact.service'
import { editorJsonFromBlocks, plainTextFromEditorJson } from './editorJsonUtils'

export function validatePatch(patch: DocumentPatchResult): void {
  if (!patch?.type) throw new Error('patch.type 不能为空')
  if (patch.type === 'noop') return
  if (patch.type === 'replace_selection' && !patch.text?.trim()) {
    throw new Error('replace_selection 需要 text')
  }
}

export function applyPatchToDocument(
  documentId: string,
  userId: string,
  patch: DocumentPatchResult,
  editorJson?: Record<string, unknown>,
): { editorJson: Record<string, unknown> } {
  const record = loadStudioDocument(documentId, userId)
  if (!record) throw new Error('文稿不存在或无权限访问')
  if (patch.type === 'noop' && editorJson) {
    const updated = updateStudioEditorJson(documentId, userId, editorJson)
    return { editorJson: updated.editorJson }
  }
  const base = editorJson || record.editorJson
  const next = JSON.parse(JSON.stringify(base)) as Record<string, unknown>

  if (patch.type === 'replace_document' && patch.text) {
    const lines = patch.text.split(/\n+/).filter(Boolean)
    const blocks = lines.map((line, i) => ({
      id: `block-${String(i + 1).padStart(3, '0')}`,
      type: (i === 0 ? 'heading' : 'paragraph') as 'heading' | 'paragraph',
      level: i === 0 ? 1 : undefined,
      text: line,
    }))
    const updated = updateStudioEditorJson(documentId, userId, editorJsonFromBlocks(blocks))
    return { editorJson: updated.editorJson }
  }

  if (patch.type === 'replace_selection' && patch.text && patch.selection?.text) {
    const fullText = plainTextFromEditorJson(next)
    const selected = patch.selection.text
    const idx = fullText.indexOf(selected)
    if (idx >= 0) {
      const replaced = fullText.slice(0, idx) + patch.text + fullText.slice(idx + selected.length)
      const paragraphs = replaced.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
      const blocks = paragraphs.map((text, i) => ({
        id: `block-${String(i + 1).padStart(3, '0')}`,
        type: (i === 0 && text.length < 80 ? 'heading' : 'paragraph') as 'heading' | 'paragraph',
        level: i === 0 ? 1 : undefined,
        text,
      }))
      const updated = updateStudioEditorJson(documentId, userId, editorJsonFromBlocks(blocks))
      return { editorJson: updated.editorJson }
    }
  }

  if (patch.type === 'insert_after_block' && patch.text) {
    const content = Array.isArray(next.content) ? [...(next.content as unknown[])] : []
    content.push({
      type: 'paragraph',
      attrs: { blockId: `block-${String(content.length + 1).padStart(3, '0')}`, role: 'body' },
      content: [{ type: 'text', text: patch.text }],
    })
    next.content = content
    const updated = updateStudioEditorJson(documentId, userId, next)
    return { editorJson: updated.editorJson }
  }

  const updated = updateStudioEditorJson(documentId, userId, next)
  return { editorJson: updated.editorJson }
}
