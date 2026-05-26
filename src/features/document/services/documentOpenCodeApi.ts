import { resolveWebApiUrl } from '../../../runtime/apiBase'
import type { DocumentEditPatch } from './documentWorkbenchApi'

export type WebDocToolId =
  | 'chat'
  | 'rewrite_selection'
  | 'expand_selection'
  | 'polish_selection'
  | 'continue_writing'
  | 'add_citation'
  | 'generate_document'

export interface WebDocToolMeta {
  id: WebDocToolId
  label: string
  description: string
  needsSelection: boolean
}

export interface WebDocPatchJson {
  type: string
  blockId?: string
  replacementText?: string
  selectedText?: string
  html?: string
  text?: string
}

export interface WebDocOpenCodeResponse {
  success: boolean
  assistantMessage: string
  patch?: WebDocPatchJson | null
  source?: 'opencode' | 'llm-fallback'
  error?: string
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveWebApiUrl(path), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || `请求失败（${response.status}）`)
  }
  return payload
}

export async function listWebDocOpenCodeTools(): Promise<WebDocToolMeta[]> {
  const data = await requestJson<{ tools: WebDocToolMeta[] }>('/api/document/opencode/tools')
  return data.tools || []
}

export interface InvokeWebDocOpenCodeInput {
  tool: WebDocToolId
  instruction: string
  title?: string
  html: string
  selectedText?: string
  selectedBlockId?: string | null
  selectedSectionId?: string | null
}

export async function invokeWebDocOpenCode(input: InvokeWebDocOpenCodeInput): Promise<WebDocOpenCodeResponse> {
  return requestJson<WebDocOpenCodeResponse>('/api/document/opencode/invoke', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function chatWebDocOpenCode(input: Omit<InvokeWebDocOpenCodeInput, 'tool'> & { tool?: WebDocToolId }): Promise<WebDocOpenCodeResponse> {
  return requestJson<WebDocOpenCodeResponse>('/api/document/opencode/chat', {
    method: 'POST',
    body: JSON.stringify({ ...input, tool: input.tool || 'chat' }),
  })
}

export function mapWebDocPatchToDocumentPatch(
  patch: WebDocPatchJson | null | undefined,
  selectedText?: string,
): DocumentEditPatch | null {
  if (!patch?.type) return null
  switch (patch.type) {
    case 'replace_block_text':
      if (!patch.blockId || patch.replacementText === undefined) return null
      return { type: 'replace_block_text', blockId: patch.blockId, replacementText: patch.replacementText }
    case 'replace_selection':
      return {
        type: 'replace_selection',
        selectedText: patch.selectedText || selectedText || '',
        replacementText: patch.replacementText || '',
      }
    case 'insert_at_cursor':
      return { type: 'insert_at_cursor', text: patch.text, html: patch.html }
    case 'replace_document':
      if (!patch.html?.trim()) return null
      return { type: 'replace_document', html: patch.html }
    default:
      return null
  }
}

/** 右键菜单默认指令（OpenCode 工具入口） */
export const WEBDOC_CONTEXT_MENU_ACTIONS: Array<{
  tool: WebDocToolId
  label: string
  instruction: string
  needsSelection: boolean
}> = [
  { tool: 'rewrite_selection', label: '重写选区', instruction: '请改写选中内容，保持原意，表达更清晰。', needsSelection: true },
  { tool: 'expand_selection', label: '扩写选区', instruction: '请扩写选中内容，补充必要说明，不要编造事实。', needsSelection: true },
  { tool: 'polish_selection', label: '润色选区', instruction: '请将选中内容润色为正式、流畅的中文办公文风。', needsSelection: true },
  { tool: 'add_citation', label: '添加引用', instruction: '请在当前段落末尾添加引用占位，并说明需要补充的文献来源。', needsSelection: false },
  { tool: 'continue_writing', label: 'AI 续写', instruction: '请紧接上文在当前位置续写一段内容。', needsSelection: false },
  { tool: 'generate_document', label: '生成全文', instruction: '请根据用户主题生成完整 HTML 文稿正文。', needsSelection: false },
]
