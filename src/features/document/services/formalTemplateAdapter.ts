/**
 * formalTemplateAdapter.ts — Web formal template adapter
 *
 * Routes formal_template workflow to:
 *   Web: POST /api/document/formal-template/generate
 *   Electron: window.electronAPI.formalTemplate:* (if available)
 *
 * Calls server API for Web deployment (no window.electronAPI dependency).
 */

import { isWebShim } from '../../../platform'

function readAuthToken(): string | null {
  try {
    return (
      window.localStorage.getItem('aios_auth_token') ??
      window.localStorage.getItem('aios_itoken') ??
      window.localStorage.getItem('ai_office_internal_token') ??
      null
    )
  } catch {
    return null
  }
}

export interface WebFieldSchema {
  fieldId: string
  label: string
  required: boolean
  dataType: string
  hint?: string
  occurrences: number
}

export interface FormalTemplatePreset {
  id: string
  label: string
  description: string
  category: string
}

export interface FormalTemplateAnalyzeResult {
  presetId: string
  presetLabel: string
  templateText: string
  fields: WebFieldSchema[]
  defaultSections: string[]
  diagnostics: { chain: string; steps: string[] }
}

export interface FormalTemplateGenerateResult {
  html: string
  markdown: string
  title: string
  presetId: string
  presetLabel: string
  resolvedFields: Record<string, string>
  message?: string
  diagnostics: { chain: string; steps: string[] }
}

export interface RunFormalTemplateGenerateInput {
  instruction: string
  presetId?: string
  customTemplateText?: string
  fieldOverrides?: Record<string, string>
  language?: 'zh' | 'en'
  workspacePath?: string
  extraContext?: string
  onStatus?: (message: string) => void
}

/** List available formal template presets from server */
export async function listFormalTemplatePresets(): Promise<FormalTemplatePreset[]> {
  const token = readAuthToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const resp = await fetch('/api/document/formal-template/presets', { headers })
  if (!resp.ok) throw new Error(`获取预设模板列表失败 (${resp.status})`)
  const data = await resp.json() as { presets: FormalTemplatePreset[] }
  return data.presets
}

/** Analyze a formal template: extract fields */
export async function analyzeFormalTemplate(input: {
  presetId?: string
  customTemplateText?: string
  instruction?: string
}): Promise<FormalTemplateAnalyzeResult> {
  const token = readAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const resp = await fetch('/api/document/formal-template/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })
  const data = await resp.json()
  if (!resp.ok || !data.success) {
    throw new Error(String(data.error || `分析失败 (${resp.status})`))
  }
  return data as FormalTemplateAnalyzeResult
}

/** Generate a filled formal template document */
export async function runFormalTemplateGenerate(
  input: RunFormalTemplateGenerateInput,
): Promise<FormalTemplateGenerateResult> {
  // In desktop Electron with real IPC, defer to Electron's 4-stage pipeline.
  // In Web (or Electron with web shim), call the server REST API.
  if (
    typeof window !== 'undefined' &&
    typeof (window as { electronAPI?: unknown }).electronAPI !== 'undefined' &&
    !isWebShim()
  ) {
    input.onStatus?.('正在调用本地正式模板链路…')
    // Electron: delegate to prebuilt multi-stage pipeline
    // (Electron IPC not available on web — this branch is Electron-only)
    throw new Error('Electron 正式模板链路: 请通过 FormalTemplatePanel 调用完整管线。')
  }

  // Web: call server REST API
  const token = readAuthToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  input.onStatus?.('正在解析字段并生成正文…')

  const resp = await fetch('/api/document/formal-template/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      presetId: input.presetId,
      customTemplateText: input.customTemplateText,
      instruction: input.instruction,
      language: input.language,
      fieldOverrides: input.fieldOverrides,
      extraContext: input.extraContext,
      workspacePath: input.workspacePath,
    }),
  })

  const data = await resp.json()

  if (!resp.ok || !data.success) {
    const errMsg = String(data.error || data.message || `正式模板生成失败 (${resp.status})`)
    throw new Error(errMsg)
  }

  input.onStatus?.('正式模板已生成')

  return {
    html: String(data.html ?? ''),
    markdown: String(data.markdown ?? ''),
    title: String(data.title ?? '正式模板文稿'),
    presetId: String(data.presetId ?? 'custom'),
    presetLabel: String(data.presetLabel ?? '正式模板'),
    resolvedFields: (data.resolvedFields as Record<string, string>) ?? {},
    message: '正式模板链路已完成',
    diagnostics: data.diagnostics ?? { chain: 'web-formal-template-runtime', steps: [] },
  }
}
