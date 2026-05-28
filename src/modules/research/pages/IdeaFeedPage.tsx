import { useCallback, useEffect, useMemo, useState } from 'react'
import { generateIdeas } from '../api/researchApi'
import { appendServedIdeaIds, loadServedIdeaIds, rankFeed, type RankedResearchIdea } from '../api/feedRank'
import { uploadPaperPdf } from '../api/paperApi'
import { researchFields, createDefaultResearchWorkspaceState } from '../mockResearchData'
import type { ResearchWorkspaceState } from '../types'
import ScienceRelayFeed from '../components/ScienceRelayFeed'
import SubjectSelectionPanel from '../components/SubjectSelectionPanel'
import ResearchSubscriptionPanel from '../components/ResearchSubscriptionPanel'

const STORAGE_KEY = 'aios_research_idea_workspace'

const DEFAULT_SOURCE_TEXT =
  '钙钛矿太阳能电池的效率与稳定性仍是关键挑战，需要新的界面钝化策略与缺陷钝化材料。'

function loadState(): ResearchWorkspaceState {
  const defaults = createDefaultResearchWorkspaceState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<ResearchWorkspaceState>
    return {
      ...defaults,
      ...parsed,
      subscriptions: parsed.subscriptions?.length ? parsed.subscriptions : defaults.subscriptions,
      matters: parsed.matters?.length ? parsed.matters : defaults.matters,
    }
  } catch {
    return defaults
  }
}

export default function IdeaFeedPage() {
  const [workspaceState, setWorkspaceState] = useState<ResearchWorkspaceState>(loadState)
  const [ideas, setIdeas] = useState<RankedResearchIdea[]>([])
  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE_TEXT)
  const [projectId, setProjectId] = useState('')
  const [fulltextMode, setFulltextMode] = useState(false)
  const [useFeedRank, setUseFeedRank] = useState(true)
  const [ideaGenerating, setIdeaGenerating] = useState(false)
  const [ideaError, setIdeaError] = useState<string | null>(null)
  const [lastRankingInfo, setLastRankingInfo] = useState<string | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfUploadMessage, setPdfUploadMessage] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaceState))
  }, [workspaceState])

  const selectedField = useMemo(
    () => researchFields.find(f => f.id === workspaceState.selectedFieldId) ?? researchFields[0],
    [workspaceState.selectedFieldId],
  )

  const handleUploadPdf = useCallback(async (file: File) => {
    setPdfUploading(true)
    setPdfUploadMessage(null)
    try {
      const meta = await uploadPaperPdf(file)
      setProjectId(meta.project_id)
      setFulltextMode(true)
      setPdfUploadMessage(`已上传 ${meta.paper_filename}`)
    } catch (e) {
      setPdfUploadMessage(e instanceof Error ? e.message : String(e))
    } finally {
      setPdfUploading(false)
    }
  }, [])

  const handleGenerateIdeas = useCallback(async () => {
    setIdeaGenerating(true)
    setIdeaError(null)
    setLastRankingInfo(null)
    try {
      const { ideas: generated } = await generateIdeas({
        projectId: projectId.trim() || undefined,
        selectedText: sourceText,
        field: selectedField.name,
        fulltext: fulltextMode,
      })

      let displayIdeas: RankedResearchIdea[]
      if (useFeedRank && generated.length > 0) {
        const ranked = await rankFeed({
          ideas: generated,
          field: selectedField.name,
          servedIdeaIds: loadServedIdeaIds(),
          subscriptionQueries: workspaceState.subscriptions.filter(s => s.enabled).map(s => s.query),
        })
        displayIdeas = ranked.ideas
        const r = ranked.ranking
        setLastRankingInfo(r ? `${r.algorithm}：${r.candidateCount} → ${r.returnedCount} 条` : '已完成排序')
        appendServedIdeaIds(displayIdeas.map(i => i.id))
      } else {
        displayIdeas = generated.map(idea => {
          const total = idea.noveltyScore * 0.25 + idea.feasibilityScore * 0.2
          return {
            ...idea,
            rankScore: total,
            rankBreakdown: {
              fieldMatch: 0,
              novelty: idea.noveltyScore * 0.25,
              feasibility: idea.feasibilityScore * 0.2,
              evidence: 0,
              paperRelevance: 0,
              riskAdjust: 0,
              subscriptionBoost: 0,
              servedPenalty: 0,
              total,
            },
          }
        })
      }

      setIdeas(displayIdeas)
      if (displayIdeas.length > 0) {
        setWorkspaceState(prev => ({ ...prev, selectedIdeaId: displayIdeas[0].id }))
      }
    } catch (e) {
      setIdeaError(e instanceof Error ? e.message : String(e))
    } finally {
      setIdeaGenerating(false)
    }
  }, [fulltextMode, projectId, selectedField.name, sourceText, useFeedRank, workspaceState.subscriptions])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <SubjectSelectionPanel
            fields={researchFields}
            selectedFieldId={workspaceState.selectedFieldId}
            onSelectField={fieldId => setWorkspaceState(p => ({ ...p, selectedFieldId: fieldId }))}
          />
          <ResearchSubscriptionPanel
            subscriptions={workspaceState.subscriptions}
            onToggleSubscription={id =>
              setWorkspaceState(p => ({
                ...p,
                subscriptions: p.subscriptions.map(s =>
                  s.id === id ? { ...s, enabled: !s.enabled } : s,
                ),
              }))
            }
            onAddSubscription={payload => {
              const ts = new Date().toISOString()
              setWorkspaceState(p => ({
                ...p,
                subscriptions: [
                  {
                    id: `sub-${ts}`,
                    title: payload.title,
                    type: payload.type,
                    query: payload.query,
                    enabled: true,
                    paperCount: 8,
                    lastUpdatedAt: ts,
                  },
                  ...p.subscriptions,
                ],
              }))
            }}
          />
        </aside>
        <ScienceRelayFeed
          ideas={ideas}
          selectedIdeaId={workspaceState.selectedIdeaId}
          onSelectIdea={id => setWorkspaceState(p => ({ ...p, selectedIdeaId: id }))}
          onConvertIdea={() => undefined}
          sourceText={sourceText}
          onSourceTextChange={setSourceText}
          projectId={projectId}
          onProjectIdChange={setProjectId}
          fulltextMode={fulltextMode}
          onFulltextModeChange={setFulltextMode}
          onGenerateIdeas={() => void handleGenerateIdeas()}
          generating={ideaGenerating}
          generateError={ideaError}
          useFeedRank={useFeedRank}
          onUseFeedRankChange={setUseFeedRank}
          lastRankingInfo={lastRankingInfo}
          onUploadPdf={f => void handleUploadPdf(f)}
          pdfUploading={pdfUploading}
          pdfUploadMessage={pdfUploadMessage}
        />
      </div>
    </div>
  )
}
