export type KnowledgeSourceType = 'knowledge_base' | 'file' | 'policy' | 'literature' | 'manual_note'
export type KnowledgeTrustLevel = 'verified' | 'partial' | 'unverified' | 'unknown'

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
}

export interface KnowledgeChunk extends KnowledgeCitationChunk {
  text: string
  score?: number
}

export interface KnowledgeSearchResult {
  chunks: KnowledgeCitationChunk[]
  mockable: boolean
}
