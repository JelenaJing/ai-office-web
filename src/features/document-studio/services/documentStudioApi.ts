import { resolveWebApiUrl } from '../../../runtime/apiBase'

function authHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('aios_token') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(resolveWebApiUrl(path), {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers as Record<string, string> | undefined) },
  })
  const data = (await res.json()) as T & { success?: boolean; error?: string }
  if (!res.ok || data.success === false) {
    throw new Error((data as { error?: string }).error || `请求失败 (${res.status})`)
  }
  return data
}

export interface DocumentTypeField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
}

export interface DocumentTypeDef {
  id: string
  label: string
  description: string
  generateCapabilityId: string
  fields: DocumentTypeField[]
}

export interface DocumentPatch {
  type: string
  text?: string
  summary?: string[]
  warnings?: string[]
  selection?: { from?: number; to?: number; text?: string; blockIds?: string[] }
}

export interface StudioDocumentResponse {
  success: boolean
  documentId: string
  artifactId: string
  documentType: string
  title: string
  editorJson: Record<string, unknown>
  contentModel: Record<string, unknown>
  documentMarkdown?: string
}

export interface OpenCodeStatusResponse {
  success: boolean
  opencodeAvailable: boolean
  opencodeVersion: string | null
  opencodeBin: string
  aiosSkillsRoot: string
  humanizer: { installed: boolean; status: string; source: string; label: string }
  newsWriter: { installed: boolean; status: string; source: string; label: string }
  academicResearchSkills: { installed: boolean; status: string; label: string }
}

export async function fetchOpenCodeStatus(): Promise<OpenCodeStatusResponse> {
  return requestJson('/api/document-studio/opencode-status')
}

export async function fetchDocumentTypes(): Promise<{ documentTypes: DocumentTypeDef[] }> {
  return requestJson('/api/document-types')
}

export async function createDocumentJob(body: {
  documentType: string
  capabilityId: string
  fields: Record<string, unknown>
  materials?: unknown[]
  language?: string
  tone?: string
}): Promise<{ jobId: string; status: string; progressStage?: string }> {
  return requestJson('/api/documents/jobs', { method: 'POST', body: JSON.stringify(body) })
}

export async function fetchJob(jobId: string): Promise<{
  status: string
  artifactId?: string
  documentId?: string
  error?: string
  progressStage?: string
  pending?: boolean
  fallback?: boolean
  fallbackReason?: string
  source?: string
}> {
  return requestJson(`/api/jobs/${encodeURIComponent(jobId)}`)
}

export async function fetchDocument(documentId: string): Promise<StudioDocumentResponse> {
  return requestJson(`/api/documents/${encodeURIComponent(documentId)}`)
}

export async function runDocumentCapability(
  documentId: string,
  capabilityId: string,
  body: {
    scope?: string
    selection?: DocumentPatch['selection']
    instruction?: string
    documentContext?: { title: string; documentType: string }
  },
): Promise<{
  resultType: string
  patch?: DocumentPatch
  comments?: Array<{ text: string }>
  exportUrl?: string
  filename?: string
  source?: string
  fallback?: boolean
}> {
  return requestJson(`/api/documents/${encodeURIComponent(documentId)}/capabilities/${encodeURIComponent(capabilityId)}/run`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function applyDocumentPatch(
  documentId: string,
  patch: DocumentPatch,
  editorJson?: Record<string, unknown>,
): Promise<{ editorJson: Record<string, unknown> }> {
  return requestJson(`/api/documents/${encodeURIComponent(documentId)}/patch`, {
    method: 'POST',
    body: JSON.stringify({ patch, editorJson }),
  })
}

export async function exportDocument(
  documentId: string,
  format: 'markdown' | 'html' | 'docx',
): Promise<{
  exportUrl: string
  filename: string
}> {
  return requestJson(`/api/documents/${encodeURIComponent(documentId)}/export`, {
    method: 'POST',
    body: JSON.stringify({ format }),
  })
}

export function resolveExportDownloadUrl(exportUrl: string): string {
  return resolveWebApiUrl(exportUrl)
}
