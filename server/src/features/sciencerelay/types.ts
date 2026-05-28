export interface ScienceRelayManifestRow {
  id: string
  title?: string
  topic?: string
  topicI18n?: unknown
  oneLineSummary?: string
  publishedDate?: string
  thumb?: string
  authors?: string[] | string
  articleType?: string
  scientist?: boolean
}

export interface ScienceRelayArticle {
  id: string
  title?: string
  topic?: string
  publishedDate?: string
  doi?: string
  citation?: string
  journal?: string
  subjects?: string[]
  thumbnail?: string
  commentaries?: unknown
  commentary?: unknown
  oneLineSummary?: string
  source?: unknown
  figures?: unknown
  journalMeta?: unknown
  subjectsI18n?: unknown
  topicI18n?: unknown
  authors?: unknown
  articleType?: string
}

export interface ArticleCandidate {
  id: string
  title: string
  topic: string
  publishedDate?: string
  oneLineSummary?: string
  thumb?: string
  authors?: string[]
  doi?: string
  citation?: string
  journal?: string
  subjects?: string[]
}

export interface ListArticlesResponse {
  success: boolean
  topic?: string
  total: number
  returned: number
  articles: ArticleCandidate[]
  partialMissing?: string[]
}

export type DedupeMode = 'none' | 'id' | 'doi'

export interface ScienceRelayRecoContext {
  topic?: string
  subscriptionQueries?: string[]
  servedArticleIds?: string[]
  topK?: number
  dedupeMode?: DedupeMode
  servedPenaltyStrength?: number
}

export interface ScienceRelayRankBreakdown {
  topicMatch: number
  subjectOverlap: number
  freshness: number
  qualitySignals: number
  subscriptionBoost: number
  servedPenalty: number
  total: number
}

export interface RankedScienceRelayArticle extends ArticleCandidate {
  rankScore: number
  rankBreakdown: ScienceRelayRankBreakdown
}

export interface RankScienceRelayResponse {
  success: boolean
  topic?: string
  candidateCount: number
  returnedCount: number
  algorithm: 'rule-based-v1'
  inspiredBy: string
  articles: RankedScienceRelayArticle[]
  partialMissing?: string[]
}

