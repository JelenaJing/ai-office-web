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

export interface WebDocChatTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface InvokeWebDocOpenCodeInput {
  tool: WebDocToolId
  instruction: string
  title?: string
  html: string
  selectedText?: string
  selectedBlockId?: string | null
  selectedSectionId?: string | null
  chatHistory?: WebDocChatTurn[]
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

export async function chatWebDocOpenCodeStream(
  input: Omit<InvokeWebDocOpenCodeInput, 'tool'> & { tool?: WebDocToolId },
  options?: { onDelta?: (text: string) => void; signal?: AbortSignal },
): Promise<WebDocOpenCodeResponse> {
  const response = await fetch(resolveWebApiUrl('/api/document/opencode/chat/stream'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, tool: input.tool || 'chat' }),
    signal: options?.signal,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(payload.error || `请求失败（${response.status}）`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('服务器未返回流式响应')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let result: WebDocOpenCodeResponse | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''

    for (const chunk of chunks) {
      const lines = chunk.split('\n')
      const eventLine = lines.find((line) => line.startsWith('event: '))
      const dataLine = lines.find((line) => line.startsWith('data: '))
      if (!eventLine || !dataLine) continue

      const event = eventLine.slice(7).trim()
      let payload: Record<string, unknown> = {}
      try {
        payload = JSON.parse(dataLine.slice(6)) as Record<string, unknown>
      } catch {
        continue
      }

      if (event === 'delta' && typeof payload.text === 'string') {
        options?.onDelta?.(payload.text)
      } else if (event === 'done') {
        result = payload as unknown as WebDocOpenCodeResponse
      } else if (event === 'error') {
        throw new Error(typeof payload.error === 'string' ? payload.error : '流式请求失败')
      }
    }
  }

  if (!result) {
    throw new Error('流式响应未完成')
  }
  return result
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

export const WEBDOC_TOOL_DEFAULT_INSTRUCTIONS: Record<WebDocToolId, string> = {
  chat: '',
  rewrite_selection: '请改写选中内容，保持原意，表达更清晰自然。',
  expand_selection: '请扩写选中内容，补充必要说明，不要编造事实。',
  polish_selection: '请将选中内容润色为正式、流畅的中文办公文风。',
  add_citation: '请在当前段落末尾添加引用占位，并提示需补充文献来源。',
  continue_writing: '请紧接上文在当前位置续写一段内容。',
  generate_document: '请根据主题生成完整文稿正文。',
}

/** 右键菜单项（点击后弹出需求输入框） */
export const WEBDOC_CONTEXT_MENU_ACTIONS: Array<{
  tool: WebDocToolId
  label: string
  placeholder: string
  needsSelection: boolean
}> = [
  { tool: 'rewrite_selection', label: '重写选区…', placeholder: '例如：改为更口语化 / 压缩为两句话…', needsSelection: true },
  { tool: 'expand_selection', label: '扩写选区…', placeholder: '例如：补充背景与数据依据…', needsSelection: true },
  { tool: 'polish_selection', label: '润色选区…', placeholder: '例如：改为公文语气 / 更学术…', needsSelection: true },
  { tool: 'continue_writing', label: '续写…', placeholder: '例如：接着写结论段…', needsSelection: false },
  { tool: 'add_citation', label: '添加引用…', placeholder: '例如：补充政策文件出处…', needsSelection: false },
]

export function buildToolInstruction(tool: WebDocToolId, userRequirement: string): string {
  const custom = userRequirement.trim()
  const base = WEBDOC_TOOL_DEFAULT_INSTRUCTIONS[tool]
  if (!custom) return base
  return `${base}\n\n用户的具体要求：${custom}`
}
