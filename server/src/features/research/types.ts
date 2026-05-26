/**
 * Research API types — aligned with ai-office-web/src/modules/research/types.ts
 * and src/modules/plot/services/PlotService.ts (for integrators).
 */

export type ResearchRiskLevel = 'low' | 'medium' | 'high'
export type ResearchIdeaNextAction = 'read_more' | 'make_plan' | 'run_experiment' | 'write_proposal'

export interface ResearchPaperRef {
  id: string
  title: string
  authors: string[]
  venue: string
  year: number
  abstract: string
  tags: string[]
  relevanceScore: number
}

export interface ResearchIdeaCard {
  id: string
  title: string
  field: string
  sourcePapers: ResearchPaperRef[]
  coreObservation: string
  researchGap: string
  hypothesis: string
  possibleMethod: string
  requiredData: string[]
  requiredExperiment: string[]
  feasibilityScore: number
  noveltyScore: number
  riskLevel: ResearchRiskLevel
  nextAction: ResearchIdeaNextAction
}

export interface PlotRecommendationResponse {
  recommended_chart: string
  confidence: number
  reasoning: string
  alternative_charts: string[]
  suggested_parameters: Record<string, unknown>
  resolved_data_type?: string
  resolved_template_id?: string
  template_match_reason?: string
  options?: Array<Record<string, unknown>>
}

export interface PlotGenerateResponse {
  success: boolean
  chart_type: string
  image?: string
  file_path?: string
  message: string
  recommendation?: PlotRecommendationResponse
}

export interface ResearchApiEnvelope<T> {
  success: boolean
  error?: string
  partialMissing?: string[]
  data?: T
}
