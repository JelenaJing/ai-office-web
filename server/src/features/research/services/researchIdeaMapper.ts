import { randomUUID } from 'crypto'
import type { ResearchIdeaCard, ResearchPaperRef, ResearchRiskLevel } from '../types'

function splitInnovation(innovation: string): { gap: string; hypothesis: string } {
  const text = innovation.trim()
  if (!text) return { gap: '待补充', hypothesis: '待补充' }
  const parts = text.split(/[。；;\n]/, 2)
  if (parts.length === 2 && parts[1]?.trim()) {
    return { gap: parts[0].trim(), hypothesis: parts[1].trim() }
  }
  const mid = Math.floor(text.length / 2)
  return {
    gap: text.slice(0, mid).trim() || text,
    hypothesis: text.slice(mid).trim() || text,
  }
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

export function mapRawIdeasToCards(
  rawIdeas: Array<Record<string, unknown>>,
  field = '未分类',
): ResearchIdeaCard[] {
  const cards: ResearchIdeaCard[] = []
  for (const item of rawIdeas) {
    const title = String(item.title ?? '未命名 Idea').trim()
    const description = String(item.description ?? '').trim()
    const innovation = String(item.innovation ?? '').trim()
    const { gap, hypothesis } = splitInnovation(innovation)
    const refs = Array.isArray(item.references) ? item.references : []
    const sourcePapers = refs
      .slice(0, 8)
      .map((r, i) => referenceToPaper(String(r), i))
    cards.push({
      id: `idea-${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      title,
      field,
      sourcePapers,
      coreObservation: description || title,
      researchGap: gap,
      hypothesis,
      possibleMethod: '待细化',
      requiredData: [],
      requiredExperiment: [],
      feasibilityScore: 0.7,
      noveltyScore: 0.8,
      riskLevel: 'medium' as ResearchRiskLevel,
      nextAction: 'read_more',
    })
  }
  return cards
}
