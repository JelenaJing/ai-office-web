import fs from 'fs'
import { parseWorkspacePath, type ArtifactKnowledgeRef, type ArtifactSourceRef } from '../../../artifacts/ArtifactStore'
import { resolveUserFile } from '../../../lib/userFiles'
import { getKnowledgeBase, listFiles } from '../../../modules/knowledge'
import type { DocumentKnowledgeRef, DocumentKnowledgeRefInput } from '../types'

const TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.csv', '.json'])

function readFileSnippet(absolutePath: string, name: string, maxChars: number): string | undefined {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : ''
  if (!TEXT_EXTS.has(ext)) {
    return undefined
  }
  try {
    const raw = fs.readFileSync(absolutePath, 'utf-8').trim()
    return raw ? raw.slice(0, maxChars) : undefined
  } catch {
    return undefined
  }
}

export async function resolveDocumentKnowledgeRefs(input: {
  workspacePath: string
  knowledgeRefs?: DocumentKnowledgeRefInput[]
}): Promise<DocumentKnowledgeRef[]> {
  const refs = Array.isArray(input.knowledgeRefs) ? input.knowledgeRefs : []
  if (refs.length === 0) return []

  const resolved: DocumentKnowledgeRef[] = []
  const parsedWorkspace = parseWorkspacePath(input.workspacePath)

  for (const ref of refs) {
    if (ref.kind === 'knowledge_base') {
      try {
        const kb = await getKnowledgeBase(ref.id)
        const files = await listFiles(ref.id).catch(() => [])
        resolved.push({
          kind: 'knowledge_base',
          id: ref.id,
          label: ref.label?.trim() || kb?.name || ref.id,
          sourceTitles: files.slice(0, 6).map((item) => item.title || item.originalName).filter(Boolean),
          citationStatus: files.length > 0 ? 'partial' : 'unverified',
        })
      } catch {
        resolved.push({
          kind: 'knowledge_base',
          id: ref.id,
          label: ref.label?.trim() || ref.id,
          citationStatus: 'unverified',
        })
      }
      continue
    }

    const userId = parsedWorkspace?.userId
    const file = userId ? resolveUserFile(userId, ref.id) : null
    resolved.push({
      kind: 'file',
      id: ref.id,
      label: ref.label?.trim() || file?.entry.name || ref.id,
      excerpt: file ? readFileSnippet(file.absolutePath, file.entry.name, 2800) : undefined,
      citationStatus: file ? 'verified' : 'unverified',
    })
  }

  return resolved
}

export function buildKnowledgeRefPromptBlock(refs: DocumentKnowledgeRef[]): string {
  if (refs.length === 0) {
    return [
      '【知识依据】',
      '未提供知识库或附件依据。凡涉及政策、制度、数据、事实判断的内容，如依据不足，必须写“需要人工确认依据”。',
    ].join('\n')
  }

  const lines = refs.map((ref, index) => {
    const titles = ref.sourceTitles && ref.sourceTitles.length > 0
      ? `；相关资料：${ref.sourceTitles.join('、')}`
      : ''
    const excerpt = ref.excerpt?.trim()
      ? `\n摘录：${ref.excerpt.trim().slice(0, 600)}`
      : ''
    return `${index + 1}. [${ref.kind === 'knowledge_base' ? '知识库' : '附件'}] ${ref.label}${titles}${excerpt}`
  })

  return [
    '【知识依据】',
    ...lines,
    '写作要求：正文中的事实性、政策性、制度性表述必须能对应到以上来源；若依据不足，明确写“需要人工确认依据”，不得编造政策依据。',
  ].join('\n')
}

export function toArtifactKnowledgeRefs(refs: DocumentKnowledgeRef[]): ArtifactKnowledgeRef[] {
  return refs.map((ref) => ({
    documentId: ref.id,
    departmentId: ref.kind === 'knowledge_base' ? ref.id : undefined,
    title: ref.label,
    citationStatus: ref.citationStatus,
  }))
}

export function toArtifactSourceRefs(refs: DocumentKnowledgeRef[]): ArtifactSourceRef[] {
  return refs.map((ref) => ({
    type: ref.kind === 'knowledge_base' ? 'knowledge' : 'document',
    id: ref.id,
    label: ref.label,
  }))
}
