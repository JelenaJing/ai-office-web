import fs from 'fs'
import { parseWorkspacePath } from '../../artifacts/ArtifactStore'
import { resolveUserFile } from '../../lib/userFiles'
import { getKnowledgeBase, listFiles } from '../knowledge'

export interface DocumentContextInput {
  workspacePath?: string
  knowledgeBaseIds?: string[]
  fileIds?: string[]
  instruction?: string
  documentText?: string
}

const TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.csv', '.json'])

function readFileSnippet(absolutePath: string, name: string, maxChars: number): string {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : ''
  if (!TEXT_EXTS.has(ext)) {
    return `（文件 ${name} 已上传，当前版本仅对文本类资料提取片段；可在 instruction 中说明如何使用该资料。）`
  }
  try {
    const raw = fs.readFileSync(absolutePath, 'utf-8')
    return raw.slice(0, maxChars)
  } catch {
    return `（无法读取文件 ${name} 的文本内容）`
  }
}

export async function buildDocumentExtraContext(input: DocumentContextInput): Promise<string> {
  const parts: string[] = []
  const kbIds = (input.knowledgeBaseIds ?? []).filter(Boolean)
  const fileIds = (input.fileIds ?? []).filter(Boolean)

  if (kbIds.length) {
    const kbLines: string[] = []
    for (const id of kbIds.slice(0, 8)) {
      try {
        const kb = await getKnowledgeBase(id)
        const label = kb?.name ?? id
        let docHint = ''
        try {
          const docs = await listFiles(id)
          const names = docs.slice(0, 5).map((d) => d.title || d.originalName).filter(Boolean)
          if (names.length) docHint = `（资料：${names.join('、')}${docs.length > 5 ? ' 等' : ''}）`
        } catch {
          // ignore list failure
        }
        kbLines.push(`- ${label} [${id}]${docHint}`)
        console.info(`[document-context] knowledgeBase=${id} label=${label}`)
      } catch {
        kbLines.push(`- [${id}]`)
      }
    }
    parts.push(['【已选择知识库】', ...kbLines].join('\n'))
  }

  if (fileIds.length && input.workspacePath) {
    const parsed = parseWorkspacePath(input.workspacePath)
    const userId = parsed?.userId
    const refLines: string[] = []
    for (const fid of fileIds.slice(0, 6)) {
      if (!userId) {
        refLines.push(`- 文件 ID: ${fid}`)
        continue
      }
      const resolved = resolveUserFile(userId, fid)
      if (!resolved) {
        refLines.push(`- 文件 ID: ${fid}（未找到）`)
        continue
      }
      const snippet = readFileSnippet(resolved.absolutePath, resolved.entry.name, 2500)
      refLines.push(`- ${resolved.entry.name}:\n${snippet}`)
    }
    if (refLines.length) {
      parts.push(['【参考资料】', ...refLines].join('\n\n'))
    }
  } else if (fileIds.length) {
    parts.push(['【参考资料】', ...fileIds.map((id) => `- 文件 ID: ${id}`)].join('\n'))
  }

  if (input.documentText?.trim()) {
    parts.push(`【当前文稿】\n${input.documentText.trim().slice(0, 12000)}`)
  }

  if (input.instruction?.trim()) {
    parts.push(`【用户指令摘要】\n${input.instruction.trim().slice(0, 500)}`)
  }

  return parts.join('\n\n')
}
