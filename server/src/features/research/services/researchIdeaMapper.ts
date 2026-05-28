import { randomUUID } from 'crypto'
import type { ResearchIdeaCard, ResearchPaperRef, ResearchRiskLevel } from '../types'

function splitInnovation(innovation: string): { gap: string; hypothesis: string } {
  const text = innovation.trim()
  if (!text) return { gap: '待补充', hypothesis: '待补充' }
  const parts = text.split(/[。；;\n]+/, 2)
  if (parts.length === 2 && parts[1]?.trim()) {
    let head = parts[0].trim()
    const tail = parts[1].trim()
    if (head && !/[。；;]$/.test(head)) head = `${head}。`
    return { gap: head, hypothesis: tail }
  }
  return { gap: text, hypothesis: '待结合实验进一步验证。' }
}

function parseUnitScore(value: unknown, defaultScore: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return defaultScore
  const v = n > 1 ? n / 100 : n
  return Math.max(0, Math.min(1, v))
}

function parseRiskLevel(value: unknown): ResearchRiskLevel {
  const raw = String(value ?? 'medium').toLowerCase()
  if (raw === 'low' || raw === 'medium' || raw === 'high') return raw
  return 'medium'
}

function estimateScores(input: {
  title: string
  gap: string
  hypothesis: string
  method: string
  requiredData: string[]
  requiredExperiment: string[]
  refCount: number
}): { feasibility: number; novelty: number; risk: ResearchRiskLevel } {
  let feas = 0.42
  let nov = 0.48
  if (input.gap && input.gap !== '待补充') {
    nov += 0.12
    feas += 0.06
  }
  if (input.hypothesis && !input.hypothesis.includes('待结合实验')) {
    nov += 0.1
    feas += 0.05
  }
  if (input.method && input.method !== '待细化') {
    feas += 0.18
  }
  feas += 0.04 * Math.min(input.requiredData.length, 3)
  feas += 0.04 * Math.min(input.requiredExperiment.length, 3)
  feas += 0.06 * (Math.min(input.refCount, 3) / 3)
  nov += 0.08 * (Math.min(input.refCount, 3) / 3)
  const bucket = [...input.title].reduce((s, c) => s + c.charCodeAt(0), 0) % 9
  feas += bucket * 0.012
  nov += (8 - bucket) * 0.011
  feas = Math.max(0.35, Math.min(0.92, feas))
  nov = Math.max(0.4, Math.min(0.95, nov))
  const risk: ResearchRiskLevel =
    nov >= 0.82 && feas < 0.55 ? 'high' : feas >= 0.78 && nov < 0.65 ? 'low' : 'medium'
  return { feasibility: feas, novelty: nov, risk }
}

function referenceToPaper(ref: string, index: number): ResearchPaperRef {
  const title = ref.trim() || `Reference ${index + 1}`
  return {
    id: `ref-${index}`,
    title,
    authors: [],
    venue: '',
    year: 0,
    abstract: '',
    tags: [],
    relevanceScore: 0.5,
  }
}

function asStrList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value.split(/[；;\n]/).map(s => s.trim()).filter(Boolean)
  }
  return []
}

export function mapRawIdeasToCards(
  rawIdeas: Array<Record<string, unknown>>,
  field = '未分类',
): ResearchIdeaCard[] {
  const cards: ResearchIdeaCard[] = []
  for (const item of rawIdeas) {
    const title = String(item.title ?? '未命名 Idea').trim()
    const description = String(item.description ?? item.coreObservation ?? '').trim()
    const innovation = String(item.innovation ?? '').trim()
    let gap = String(item.researchGap ?? item.research_gap ?? '').trim()
    let hypothesis = String(item.hypothesis ?? '').trim()
    let method = String(item.possibleMethod ?? item.method ?? item.feasible_method ?? '').trim()

    if (!gap && !hypothesis && innovation) {
      const split = splitInnovation(innovation)
      gap = split.gap
      hypothesis = split.hypothesis
    } else if (!gap) {
      gap = innovation || '待补充'
    } else if (!hypothesis) {
      hypothesis = innovation || '待结合实验进一步验证。'
    }
    if (!method) method = '待细化'

    const requiredData = asStrList(item.requiredData ?? item.required_data)
    const requiredExperiment = asStrList(item.requiredExperiment ?? item.required_experiment)
    const refs = Array.isArray(item.references) ? item.references : []
    const sourcePapers = refs.slice(0, 8).map((r, i) => referenceToPaper(String(r), i))

    const hasLlmScores =
      item.feasibilityScore != null ||
      item.feasibility_score != null ||
      item.noveltyScore != null ||
      item.novelty_score != null

    let feasibilityScore: number
    let noveltyScore: number
    let riskLevel: ResearchRiskLevel

    if (hasLlmScores) {
      feasibilityScore = parseUnitScore(item.feasibilityScore ?? item.feasibility_score, 0.7)
      noveltyScore = parseUnitScore(item.noveltyScore ?? item.novelty_score, 0.8)
      riskLevel = parseRiskLevel(item.riskLevel ?? item.risk_level)
    } else {
      const est = estimateScores({
        title,
        gap,
        hypothesis,
        method,
        requiredData,
        requiredExperiment,
        refCount: sourcePapers.length,
      })
      feasibilityScore = est.feasibility
      noveltyScore = est.novelty
      riskLevel = est.risk
    }

    cards.push({
      id: `idea-${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      title,
      field,
      sourcePapers,
      coreObservation: description || title,
      researchGap: gap,
      hypothesis,
      possibleMethod: method,
      requiredData,
      requiredExperiment,
      feasibilityScore,
      noveltyScore,
      riskLevel,
      nextAction: 'read_more',
    })
  }
  return cards
}
