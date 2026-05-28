import { getApiEntryMode, researchFetch, researchJson } from './apiBase'
import type { ResearchIdeaCard } from '../types'
import type { PlotGenerateResponse, PlotRecommendationResponse } from './plotTypes'

export async function generateIdeas(params: {
  projectId?: string
  selectedText: string
  field: string
  fulltext?: boolean
}): Promise<{ ideas: ResearchIdeaCard[]; data?: { chunks?: number } }> {
  const mode = getApiEntryMode()

  if (mode === 'bff') {
    if (params.fulltext) {
      if (!params.projectId?.trim()) throw new Error('全文模式需要填写 project_id')
      return researchJson('/ideas/generate/fulltext', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.projectId,
          field: params.field,
          target_chars: 6000,
          overlap_chars: 300,
        }),
      })
    }
    return researchJson('/ideas/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: params.projectId || 'research-test-local',
        selectedText: params.selectedText,
        field: params.field,
        contract: 'v2',
      }),
    })
  }

  if (params.fulltext) {
    const out = await researchJson<{
      success: boolean
      ideas: ResearchIdeaCard[]
      data?: { chunks?: number }
    }>('/api/v1/remake/idea/fulltext/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: params.projectId,
        field: params.field,
        target_chars: 6000,
        overlap_chars: 300,
      }),
    })
    return { ideas: out.ideas, data: out.data }
  }

  const out = await researchJson<{ success: boolean; ideas: ResearchIdeaCard[] }>(
    '/api/v1/remake/idea/v2',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: params.projectId || 'research-test-local',
        selected_text: params.selectedText,
        field: params.field,
      }),
    },
  )
  return { ideas: out.ideas }
}

export async function recommendPlot(params: {
  rawText?: string
  useLlm?: boolean
  templateId?: string
}): Promise<PlotRecommendationResponse> {
  const mode = getApiEntryMode()
  if (mode === 'bff') {
    const out = await researchJson<PlotRecommendationResponse & { success: boolean }>(
      '/plots/recommend?contract=v2',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: params.rawText,
          useLlmTypeDetection: params.useLlm ?? true,
          templateId: params.templateId,
        }),
      },
    )
    return {
      recommended_chart: out.recommended_chart,
      confidence: out.confidence,
      reasoning: out.reasoning,
      alternative_charts: out.alternative_charts ?? [],
      suggested_parameters: out.suggested_parameters ?? {},
      resolved_data_type: out.resolved_data_type,
      resolved_template_id: out.resolved_template_id,
      template_match_reason: out.template_match_reason,
    }
  }

  const out = await researchJson<PlotRecommendationResponse & { success: boolean }>(
    '/api/v1/data/plot/recommend/v2',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_text: params.rawText,
        use_llm_type_detection: params.useLlm ?? true,
        template_id: params.templateId,
      }),
    },
  )
  return out
}

export async function generatePlot(params: {
  file: File
  projectId?: string
  templateId?: string
  useLlm?: boolean
}): Promise<PlotGenerateResponse> {
  const mode = getApiEntryMode()
  const form = new FormData()
  form.append('file', params.file)
  if (params.projectId) form.append('project_id', params.projectId)
  if (params.templateId) form.append('template_id', params.templateId)
  form.append('use_llm_type_detection', String(params.useLlm ?? true))
  form.append('auto_recommend', 'true')

  const path =
    mode === 'bff' ? '/plots/generate?contract=v2' : '/api/v1/data/plot/v2'

  const res = await researchFetch(path, { method: 'POST', body: form })
  const text = await res.text()
  const body = JSON.parse(text) as PlotGenerateResponse & { success?: boolean; error?: string }
  if (!res.ok || body.success === false) {
    throw new Error(body.error || text || res.statusText)
  }
  return body
}
