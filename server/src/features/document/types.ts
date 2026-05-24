import type { Artifact, ArtifactKnowledgeRef, ArtifactSourceRef } from '../../artifacts/ArtifactStore'

export type DocumentEngine = 'builtin' | 'minimax_docx'
export type DocumentFallbackMode = 'builtin' | 'none'
export type DocumentTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type DocumentLanguage = 'zh-CN' | 'en-US'
export type DocumentType =
  | 'report'
  | 'notice'
  | 'memo'
  | 'proposal'
  | 'summary'
  | 'official_letter'

export interface DocumentKnowledgeRefInput {
  kind: 'knowledge_base' | 'file'
  id: string
  label?: string
}

export interface DocumentKnowledgeRef {
  kind: 'knowledge_base' | 'file'
  id: string
  label: string
  excerpt?: string
  sourceTitles?: string[]
  citationStatus: 'verified' | 'partial' | 'unverified'
}

export interface DocumentDraftCitation {
  id: string
  label: string
  kind: 'knowledge_base' | 'file' | 'manual_note'
  note?: string
  citationStatus: 'verified' | 'partial' | 'unverified'
}

export interface DocumentDraftTable {
  id: string
  title?: string
  headers: string[]
  rows: string[][]
}

export type DocumentDraft = {
  id: string
  title: string
  type: string
  language: string
  outline: Array<{
    id: string
    level: number
    title: string
  }>
  sections: Array<{
    id: string
    title: string
    content: string
    citations?: DocumentDraftCitation[]
    tables?: DocumentDraftTable[]
  }>
  metadata: {
    engine: string
    templateId?: string
    knowledgeRefs?: DocumentKnowledgeRef[]
  }
}

export interface DocumentTemplateDefinition {
  id: string
  label: string
  description: string
  documentType: DocumentType
  defaultTitle: string
  outline: string[]
  promptHint: string
}

export interface DocumentTaskResult {
  engine: DocumentEngine
  skillId: string
  documentId: string
  artifactId: string
  exportUrl: string
  filename: string
  document: DocumentDraft
  outline: DocumentDraft['outline']
  templateId?: string
  templateLabel?: string
  knowledgeRefs: DocumentKnowledgeRef[]
  fallbackFrom?: 'minimax_docx'
  fallbackReason?: string
}

export interface DocumentRecord {
  documentId: string
  userId: string
  workspacePath: string
  engine: DocumentEngine
  skillId: string
  title: string
  language: DocumentLanguage
  documentType: DocumentType
  templateId?: string
  templateLabel?: string
  knowledgeRefs: DocumentKnowledgeRef[]
  draft: DocumentDraft
  artifactId: string
  exportUrl: string
  filename: string
  sourceRefs: ArtifactSourceRef[]
  artifactKnowledgeRefs: ArtifactKnowledgeRef[]
  artifact?: Artifact
  fallbackFrom?: 'minimax_docx'
  fallbackReason?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentTaskRecord {
  taskId: string
  documentId?: string
  status: DocumentTaskStatus
  progress: number
  message: string
  engine?: DocumentEngine
  fallbackFrom?: 'minimax_docx'
  fallbackReason?: string
  result?: DocumentTaskResult
  error?: string
  cancelRequested: boolean
  startedAt?: string
  completedAt?: string
  failedAt?: string
  lastProgressMessage?: string
  createdAt: number
  updatedAt: number
}
