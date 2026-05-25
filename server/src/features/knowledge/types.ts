export type KnowledgeSourceType = 'knowledge_base' | 'file' | 'policy' | 'literature' | 'manual_note'
export type KnowledgeTrustLevel = 'verified' | 'partial' | 'unverified' | 'unknown'
export type KnowledgeProvider = 'remote' | 'workspace'

export interface KnowledgeSearchInput {
  userId?: string
  query: string
  workspaceId?: string
  selectedSourceIds: string[]
  topK?: number
}

export interface KnowledgeSource {
  sourceId: string
  title: string
  sourceType: KnowledgeSourceType
  trustLevel: KnowledgeTrustLevel
  workspacePath?: string
  fileId?: string
  absolutePath?: string
  updatedAt?: string
}

export interface KnowledgeCitationChunk {
  sourceId: string
  chunkId: string
  title: string
  excerpt: string
  sourceType: KnowledgeSourceType
  trustLevel: KnowledgeTrustLevel
  score: number
  provider: KnowledgeProvider
  metadata?: Record<string, unknown>
}

export interface KnowledgeChunk extends KnowledgeCitationChunk {
  text: string
}

export interface KnowledgeSearchResult {
  chunks: KnowledgeCitationChunk[]
  mockable: boolean
  warnings?: string[]
}

export interface KnowledgeSourceSummary {
  id: string
  title: string
  sourceType: KnowledgeSourceType
  provider: KnowledgeProvider
  trustLevel: KnowledgeTrustLevel
  updatedAt?: string
  metadata?: Record<string, unknown>
}
