import type { PlotGenerateResponse, PlotRecommendationResponse } from '../types'

export function mapPlotV1ToGenerate(v1: Record<string, unknown>): PlotGenerateResponse {
  const metadata =
    v1.metadata && typeof v1.metadata === 'object'
      ? (v1.metadata as Record<string, unknown>)
      : {}
  const chartType = String(metadata.chart_type ?? v1.chart_type ?? 'unknown')
  const recText = String(metadata.recommendation_text ?? '')
  const recommendation: PlotRecommendationResponse = {
    recommended_chart: chartType,
    confidence: Number(metadata.confidence ?? 0.75),
    reasoning: recText || 'Plot generated',
    alternative_charts: [],
    suggested_parameters: {},
    resolved_data_type: metadata.resolved_data_type as string | undefined,
    resolved_template_id: metadata.resolved_template_id as string | undefined,
    template_match_reason: metadata.template_match_reason as string | undefined,
  }
  return {
    success: v1.status === 'success',
    chart_type: chartType,
    image: v1.plot_base64 as string | undefined,
    file_path: v1.plot_path as string | undefined,
    message: String(v1.message ?? 'Plot generation completed'),
    recommendation,
  }
}

export function mapRecommendV1(v1: Record<string, unknown>): PlotRecommendationResponse {
  const options = Array.isArray(v1.options) ? v1.options : []
  const alt = options
    .map((o) => (o && typeof o === 'object' ? String((o as Record<string, unknown>).chart_type ?? '') : ''))
    .filter(Boolean)
  let suggested: Record<string, unknown> = {}
  if (options[0] && typeof options[0] === 'object') {
    const sp = (options[0] as Record<string, unknown>).suggested_parameters
    if (sp && typeof sp === 'object') suggested = sp as Record<string, unknown>
  }
  return {
    recommended_chart: String(v1.recommended_chart ?? 'line'),
    confidence: Number(v1.confidence ?? 0.5),
    reasoning: String(v1.reasoning ?? ''),
    alternative_charts: alt.length > 1 ? alt.slice(1) : alt,
    suggested_parameters: suggested,
    resolved_data_type: v1.resolved_data_type as string | undefined,
    resolved_template_id: v1.resolved_template_id as string | undefined,
    template_match_reason: v1.template_match_reason as string | undefined,
    options: options as Array<Record<string, unknown>>,
  }
}
