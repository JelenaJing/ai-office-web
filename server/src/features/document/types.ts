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
  sourceType?: 'knowledge_base' | 'file' | 'policy' | 'literature' | 'manual_note'
  sourceId?: string
  chunkId?: string
  trustLevel?: 'verified' | 'partial' | 'unverified' | 'unknown'
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

export interface DocumentReference {
  id: string
  label: string
  kind: 'knowledge_base' | 'file' | 'manual_note'
  sourceId: string
  sourceLabel?: string
  excerpt?: string
  sourceType?: 'knowledge_base' | 'file' | 'policy' | 'literature' | 'manual_note'
  chunkId?: string
  trustLevel?: 'verified' | 'partial' | 'unverified' | 'unknown'
  citedBlockIds?: string[]
  citationStatus?: 'verified' | 'partial' | 'unverified'
}

export interface DocumentCitation {
  id: string
  refId: string
  blockId: string
  sectionId?: string | null
  text: string
  renderMode: 'inline' | 'footnote' | 'badge'
  sourceId?: string
  sourceType?: string
  chunkId?: string
  trustLevel?: string
}

export interface DocumentExportPaths {
  pdf?: string
  docx?: string
}

export type DocumentCanonicalBlock =
  | {
      id: string
      type: 'title' | 'heading' | 'paragraph' | 'quote'
      role: 'title' | 'heading' | 'paragraph' | 'quote'
      sectionId: string | null
      sectionTitle?: string
      order: number
      text: string
      level?: number
      sourceId?: string
      citationIds?: string[]
      html?: string
    }
  | {
      id: string
      type: 'list-item'
      role: 'list-item'
      sectionId: string | null
      sectionTitle?: string
      order: number
      text: string
      listKind: 'bulleted' | 'numbered'
      index: number
      sourceId?: string
      citationIds?: string[]
      html?: string
    }
  | {
      id: string
      type: 'table'
      role: 'table'
      sectionId: string | null
      sectionTitle?: string
      order: number
      title?: string
      headers: string[]
      rows: string[][]
      sourceId?: string
      citationIds?: string[]
      html?: string
    }
  | {
      id: string
      type: 'image'
      role: 'image'
      sectionId: string | null
      sectionTitle?: string
      order: number
      src: string
      alt?: string
      caption?: string
      sourceId?: string
      citationIds?: string[]
      html?: string
    }
  | {
      id: string
      type: 'divider'
      role: 'divider'
      sectionId: string | null
      sectionTitle?: string
      order: number
      sourceId?: string
      citationIds?: string[]
      html?: string
    }

export interface DocumentCanonicalSection {
  id: string
  title: string
  level: number
  blockIds: string[]
}

export interface DocumentCanonicalData {
  version: 'document-html-workbench/v1'
  documentId: string
  title: string
  type: string
  language: string
  engine: string
  templateId?: string
  outline: DocumentDraft['outline']
  sections: DocumentCanonicalSection[]
  blocks: DocumentCanonicalBlock[]
  knowledgeRefs: DocumentKnowledgeRef[]
  references: DocumentReference[]
  citations: DocumentCitation[]
}

export interface DocumentWorkbenchArtifact {
  id: string
  type: 'document'
  title: string
  html: string
  canonicalData: DocumentCanonicalData
  sourceRefs: ArtifactSourceRef[]
  knowledgeRefs: DocumentKnowledgeRef[]
  references: DocumentReference[]
  citations: DocumentCitation[]
  exportPaths: DocumentExportPaths
  createdAt: string
  updatedAt: string
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
  html: string
  documentArtifact: DocumentWorkbenchArtifact
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
  html: string
  documentArtifact: DocumentWorkbenchArtifact
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
