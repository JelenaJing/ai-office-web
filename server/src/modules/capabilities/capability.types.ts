export type CapabilityRunner = 'direct-llm' | 'opencode' | 'node' | 'pipeline' | 'legacy'

export type CapabilityScope = 'selection' | 'block' | 'document' | 'pipeline'

export type CapabilityOutputMode = 'patch' | 'new_artifact' | 'comments' | 'export'

export type CapabilityActionType =
  | 'generate_document'
  | 'transform_selection'
  | 'transform_block'
  | 'transform_document'
  | 'continue_writing'
  | 'review_document'
  | 'export_document'

export type CapabilityStatus = 'connected' | 'pending' | 'legacy-hidden'

export interface DocumentCapabilityDef {
  id: string
  label: string
  description: string
  runner: CapabilityRunner
  skillId?: string
  actionType: CapabilityActionType
  scope: CapabilityScope
  outputMode: CapabilityOutputMode
  documentTypes: string[]
  enabled: boolean
  status?: CapabilityStatus
}

export interface DocumentSelectionContext {
  from?: number
  to?: number
  text?: string
  blockIds?: string[]
}

export interface DocumentPatchResult {
  type: 'replace_selection' | 'insert_after_block' | 'replace_document' | 'replace_block' | 'noop' | 'comments'
  text?: string
  html?: string
  blockId?: string
  summary?: string[]
  warnings?: string[]
  selection?: DocumentSelectionContext
}

export interface CapabilityRunInput {
  capabilityId: string
  documentId: string
  documentType: string
  userId: string
  scope?: CapabilityScope
  selection?: DocumentSelectionContext
  instruction?: string
  editorJson?: Record<string, unknown>
  documentTitle?: string
  fields?: Record<string, unknown>
  language?: string
  tone?: string
  materials?: unknown[]
}

export interface CapabilityRunResult {
  success: boolean
  resultType: 'patch' | 'new_artifact' | 'comments' | 'export' | 'error'
  patch?: DocumentPatchResult
  artifactId?: string
  documentId?: string
  exportUrl?: string
  filename?: string
  mimeType?: string
  comments?: Array<{ blockId?: string; text: string }>
  error?: string
  source?: 'direct-llm' | 'opencode' | 'node' | 'pipeline' | 'legacy' | 'llm-fallback'
  pending?: boolean
  fallback?: boolean
  fallbackReason?: string
}

export interface DocumentGenerationJobInput {
  documentType: string
  capabilityId: string
  fields: Record<string, unknown>
  materials?: unknown[]
  language?: string
  tone?: string
  userId: string
}

export interface DocumentGenerationJobRecord {
  jobId: string
  userId: string
  documentType: string
  capabilityId: string
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'pending'
  artifactId?: string
  documentId?: string
  error?: string
  progressStage?: string
  source?: string
  fallback?: boolean
  fallbackReason?: string
  pending?: boolean
  createdAt: string
  updatedAt: string
}
