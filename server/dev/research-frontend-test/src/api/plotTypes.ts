export interface PlotRecommendationResponse {
  recommended_chart: string
  confidence: number
  reasoning: string
  alternative_charts: string[]
  suggested_parameters: Record<string, unknown>
  resolved_data_type?: string
  resolved_template_id?: string
  template_match_reason?: string
}

export interface PlotGenerateResponse {
  success: boolean
  chart_type: string
  image?: string
  file_path?: string
  message: string
  recommendation?: PlotRecommendationResponse
}
