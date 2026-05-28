import { useCallback, useEffect, useMemo, useState } from 'react'
import './research.css'
import {
  createDefaultResearchWorkspaceState,
  dailyResearchReport,
  defaultExperimentPlan,
  experimentNotebookEntries,
  localScienceCapabilities,
  personalKnowledgeSnapshot,
  researchDataAnalysisSnapshot,
  researchFields,
  researchPaperRefs,
  researchWritingTasks,
} from './mockResearchData'
import type {
  ResearchIdeaCard,
  ResearchMatter,
  ResearchMatterStatus,
  ResearchSubscription,
  ResearchWorkspaceState,
} from './types'
import { generateIdeas } from '../../api/researchApi'
import {
  appendServedIdeaIds,
  loadServedIdeaIds,
  rankFeed,
  type RankedResearchIdea,
} from '../../api/feedRank'
import { uploadPaperPdf } from '../../api/paperApi'
import ResearchHomeHeader from './components/ResearchHomeHeader'
import SubjectSelectionPanel from './components/SubjectSelectionPanel'
import ResearchSubscriptionPanel from './components/ResearchSubscriptionPanel'
import PersonalKnowledgePanel from './components/PersonalKnowledgePanel'
import DailyResearchReportPanel from './components/DailyResearchReportPanel'
import ScienceRelayFeed from './components/ScienceRelayFeed'
import ScienceRelayJournalRecoPanel from './components/ScienceRelayJournalRecoPanel'
import ResearchAssistantPanel from './components/ResearchAssistantPanel'
import LocalScienceWorkbenchPanel from './components/LocalScienceWorkbenchPanel'
import ExperimentPlanPanel from './components/ExperimentPlanPanel'
import ExperimentNotebookPanel from './components/ExperimentNotebookPanel'
import ResearchDataAnalysisPanel from './components/ResearchDataAnalysisPanel'
import ResearchWritingPanel from './components/ResearchWritingPanel'
import TemplatePlotPanel from './components/TemplatePlotPanel'

const RESEARCH_WORKSPACE_STORAGE_KEY = 'aios_research_test_workspace_state'

const matterStatusFlow: ResearchMatterStatus[] = [
  'idea',
  'reading',
  'planning',
  'experimenting',
  'analyzing',
  'writing',
  'completed',
]

const DEFAULT_SOURCE_TEXT =
  '钙钛矿太阳能电池的效率与稳定性仍是关键挑战，需要新的界面钝化策略与缺陷钝化材料。'

function loadResearchWorkspaceState(): ResearchWorkspaceState {
  const defaultState = createDefaultResearchWorkspaceState()

  try {
    const raw = localStorage.getItem(RESEARCH_WORKSPACE_STORAGE_KEY)
    if (!raw) return defaultState

    const parsed = JSON.parse(raw) as Partial<ResearchWorkspaceState>
    const matters = Array.isArray(parsed.matters) && parsed.matters.length > 0
      ? parsed.matters
      : defaultState.matters
    const selectedFieldId = researchFields.some(field => field.id === parsed.selectedFieldId)
      ? parsed.selectedFieldId!
      : defaultState.selectedFieldId
    const selectedMatterId = matters.some(matter => matter.id === parsed.selectedMatterId)
      ? parsed.selectedMatterId!
      : matters[0].id
    const selectedWritingTaskId = researchWritingTasks.some(task => task.id === parsed.selectedWritingTaskId)
      ? parsed.selectedWritingTaskId!
      : defaultState.selectedWritingTaskId

    return {
      selectedFieldId,
      selectedIdeaId: parsed.selectedIdeaId ?? '',
      selectedMatterId,
      subscriptions: Array.isArray(parsed.subscriptions) && parsed.subscriptions.length > 0
        ? parsed.subscriptions
        : defaultState.subscriptions,
      matters,
      selectedWritingTaskId,
    }
  } catch {
    return defaultState
  }
}

function nextMatterStatus(status: ResearchMatterStatus): ResearchMatterStatus {
  const currentIndex = matterStatusFlow.indexOf(status)
  if (currentIndex === -1 || currentIndex === matterStatusFlow.length - 1) return status
  return matterStatusFlow[currentIndex + 1]
}

export default function ResearchWorkspace() {
  const [workspaceState, setWorkspaceState] = useState<ResearchWorkspaceState>(loadResearchWorkspaceState)
  const [ideas, setIdeas] = useState<RankedResearchIdea[]>([])
  const [sourceText, setSourceText] = useState(DEFAULT_SOURCE_TEXT)
  const [projectId, setProjectId] = useState('')
  const [fulltextMode, setFulltextMode] = useState(false)
  const [ideaGenerating, setIdeaGenerating] = useState(false)
  const [feedRanking, setFeedRanking] = useState(false)
  const [feedRankApplied, setFeedRankApplied] = useState(false)
  const [ideaError, setIdeaError] = useState<string | null>(null)
  const [feedRankError, setFeedRankError] = useState<string | null>(null)
  const [lastRankingInfo, setLastRankingInfo] = useState<string | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfUploadMessage, setPdfUploadMessage] = useState<string | null>(null)
  const [scienceRelayTopic, setScienceRelayTopic] = useState('all')

  useEffect(() => {
    localStorage.setItem(RESEARCH_WORKSPACE_STORAGE_KEY, JSON.stringify(workspaceState))
  }, [workspaceState])

  const selectedField = useMemo(
    () => researchFields.find(field => field.id === workspaceState.selectedFieldId) ?? researchFields[0],
    [workspaceState.selectedFieldId],
  )

  const feedIdeas = ideas

  const selectedIdea = useMemo(
    () => ideas.find(idea => idea.id === workspaceState.selectedIdeaId) ?? ideas[0] ?? null,
    [ideas, workspaceState.selectedIdeaId],
  )

  const selectedMatter = useMemo(
    () => workspaceState.matters.find(matter => matter.id === workspaceState.selectedMatterId) ?? workspaceState.matters[0] ?? null,
    [workspaceState.matters, workspaceState.selectedMatterId],
  )

  const reportNewPapers = useMemo(
    () => dailyResearchReport.newPaperIds
      .map(id => researchPaperRefs.find(paper => paper.id === id))
      .filter((paper): paper is typeof researchPaperRefs[number] => Boolean(paper)),
    [],
  )

  const reportRelatedPapers = useMemo(
    () => dailyResearchReport.relatedPaperIds
      .map(id => researchPaperRefs.find(paper => paper.id === id))
      .filter((paper): paper is typeof researchPaperRefs[number] => Boolean(paper)),
    [],
  )

  const handleUploadPdf = useCallback(async (file: File) => {
    setPdfUploading(true)
    setPdfUploadMessage(null)
    try {
      const meta = await uploadPaperPdf(file)
      setProjectId(meta.project_id)
      setFulltextMode(true)
      setPdfUploadMessage(`已上传 ${meta.paper_filename} → project_id=${meta.project_id}`)
    } catch (e) {
      setPdfUploadMessage(e instanceof Error ? e.message : String(e))
    } finally {
      setPdfUploading(false)
    }
  }, [])

  const handleGenerateIdeas = useCallback(async () => {
    setIdeaGenerating(true)
    setIdeaError(null)
    setFeedRankError(null)
    setLastRankingInfo(null)
    setFeedRankApplied(false)
    try {
      const { ideas: generated } = await generateIdeas({
        projectId: projectId.trim() || undefined,
        selectedText: sourceText,
        field: selectedField.name,
        fulltext: fulltextMode,
      })

      setIdeas(generated as RankedResearchIdea[])
      if (generated.length > 0) {
        setWorkspaceState(previous => ({ ...previous, selectedIdeaId: generated[0].id }))
      }
    } catch (e) {
      setIdeaError(e instanceof Error ? e.message : String(e))
    } finally {
      setIdeaGenerating(false)
    }
  }, [fulltextMode, projectId, selectedField.name, sourceText])

  const handleApplyFeedRank = useCallback(async () => {
    if (ideas.length === 0) return
    setFeedRanking(true)
    setFeedRankError(null)
    try {
      const subQueries = workspaceState.subscriptions
        .filter(s => s.enabled)
        .map(s => s.query)
      const ranked = await rankFeed({
        ideas,
        field: selectedField.name,
        servedIdeaIds: loadServedIdeaIds(),
        subscriptionQueries: subQueries,
      })
      setIdeas(ranked.ideas)
      setFeedRankApplied(true)
      const r = ranked.ranking
      setLastRankingInfo(
        r
          ? `${r.algorithm}：${r.candidateCount} 条候选 → ${r.returnedCount} 条（按 Feed 分降序）`
          : '已完成 X Feed 推荐排序',
      )
      appendServedIdeaIds(ranked.ideas.map(i => i.id))
      if (ranked.ideas.length > 0) {
        setWorkspaceState(previous => ({ ...previous, selectedIdeaId: ranked.ideas[0].id }))
      }
    } catch (e) {
      setFeedRankError(e instanceof Error ? e.message : String(e))
    } finally {
      setFeedRanking(false)
    }
  }, [ideas, selectedField.name, workspaceState.subscriptions])

  const handleSelectField = (fieldId: string) => {
    setWorkspaceState(previous => ({
      ...previous,
      selectedFieldId: fieldId,
    }))
  }

  const handleToggleSubscription = (subscriptionId: string) => {
    setWorkspaceState(previous => ({
      ...previous,
      subscriptions: previous.subscriptions.map(subscription => (
        subscription.id === subscriptionId
          ? { ...subscription, enabled: !subscription.enabled }
          : subscription
      )),
    }))
  }

  const handleAddSubscription = (payload: {
    title: string
    type: ResearchSubscription['type']
    query: string
  }) => {
    const timestamp = new Date().toISOString()
    const nextSubscription: ResearchSubscription = {
      id: `sub-local-${timestamp}`,
      title: payload.title,
      type: payload.type,
      query: payload.query,
      enabled: true,
      paperCount: Math.max(3, Math.min(18, payload.query.length)),
      lastUpdatedAt: timestamp,
    }

    setWorkspaceState(previous => ({
      ...previous,
      subscriptions: [nextSubscription, ...previous.subscriptions],
    }))
  }

  const handleSelectIdea = (ideaId: string) => {
    setWorkspaceState(previous => ({
      ...previous,
      selectedIdeaId: ideaId,
    }))
  }

  const handleConvertIdeaToMatter = (ideaId: string) => {
    const idea = ideas.find(item => item.id === ideaId)
    if (!idea) return

    setWorkspaceState(previous => {
      const existingMatter = previous.matters.find(matter => matter.title === idea.title && matter.field === idea.field)
      if (existingMatter) {
        return {
          ...previous,
          selectedIdeaId: ideaId,
          selectedMatterId: existingMatter.id,
        }
      }

      const timestamp = new Date().toISOString()
      const nextMatter: ResearchMatter = {
        id: `matter-${idea.id}`,
        title: idea.title,
        field: idea.field,
        objective: `围绕“${idea.title}”形成可验证研究路径，并准备最小可执行实验闭环。`,
        hypothesis: idea.hypothesis,
        sourcePaperIds: idea.sourcePapers.map(paper => paper.id),
        status: 'idea',
        createdAt: timestamp,
        updatedAt: timestamp,
        outputs: ['experiment_plan', 'notebook', 'analysis_report', 'paper_draft', 'ppt'],
      }

      return {
        ...previous,
        selectedIdeaId: ideaId,
        selectedMatterId: nextMatter.id,
        matters: [nextMatter, ...previous.matters],
      }
    })
  }

  const handleSelectMatter = (matterId: string) => {
    setWorkspaceState(previous => ({
      ...previous,
      selectedMatterId: matterId,
    }))
  }

  const handleSetMatterStatus = (matterId: string, status: ResearchMatterStatus) => {
    setWorkspaceState(previous => ({
      ...previous,
      matters: previous.matters.map(matter => (
        matter.id === matterId
          ? { ...matter, status, updatedAt: new Date().toISOString() }
          : matter
      )),
      selectedMatterId: matterId,
    }))
  }

  const handleAdvanceMatterStatus = (matterId: string) => {
    setWorkspaceState(previous => ({
      ...previous,
      matters: previous.matters.map(matter => (
        matter.id === matterId
          ? {
            ...matter,
            status: nextMatterStatus(matter.status),
            updatedAt: new Date().toISOString(),
          }
          : matter
      )),
      selectedMatterId: matterId,
    }))
  }

  const handleSelectWritingTask = (taskId: string) => {
    setWorkspaceState(previous => ({
      ...previous,
      selectedWritingTaskId: taskId,
    }))
  }

  return (
    <div className="research-workspace">
      <ResearchHomeHeader
        field={selectedField}
        paperCount={dailyResearchReport.newPaperIds.length}
        ideaCount={ideas.length}
        matterCount={workspaceState.matters.length}
      />

      <div className="research-grid">
        <div className="research-column">
          <SubjectSelectionPanel
            fields={researchFields}
            selectedFieldId={workspaceState.selectedFieldId}
            onSelectField={handleSelectField}
          />
          <ResearchSubscriptionPanel
            subscriptions={workspaceState.subscriptions}
            onToggleSubscription={handleToggleSubscription}
            onAddSubscription={handleAddSubscription}
          />
          <PersonalKnowledgePanel knowledge={personalKnowledgeSnapshot} />
        </div>

        <div className="research-column">
          <DailyResearchReportPanel
            report={dailyResearchReport}
            newPapers={reportNewPapers}
            relatedPapers={reportRelatedPapers}
          />
          <ScienceRelayJournalRecoPanel
            subscriptions={workspaceState.subscriptions}
            selectedTopic={scienceRelayTopic}
            onSelectedTopicChange={setScienceRelayTopic}
          />
          <TemplatePlotPanel projectId={projectId.trim() || undefined} />
          <ScienceRelayFeed
            ideas={feedIdeas}
            selectedIdeaId={selectedIdea?.id ?? ''}
            onSelectIdea={handleSelectIdea}
            onConvertIdea={handleConvertIdeaToMatter}
            sourceText={sourceText}
            onSourceTextChange={setSourceText}
            projectId={projectId}
            onProjectIdChange={setProjectId}
            fulltextMode={fulltextMode}
            onFulltextModeChange={setFulltextMode}
            onGenerateIdeas={() => void handleGenerateIdeas()}
            generating={ideaGenerating}
            generateError={ideaError}
            onApplyFeedRank={() => void handleApplyFeedRank()}
            feedRanking={feedRanking}
            feedRankApplied={feedRankApplied}
            feedRankError={feedRankError}
            lastRankingInfo={lastRankingInfo}
            selectedFieldName={selectedField.name}
            onUploadPdf={(f) => void handleUploadPdf(f)}
            pdfUploading={pdfUploading}
            pdfUploadMessage={pdfUploadMessage}
          />
        </div>

        <div className="research-column">
          <ResearchAssistantPanel
            selectedIdea={selectedIdea}
            matters={workspaceState.matters}
            selectedMatterId={workspaceState.selectedMatterId}
            onSelectMatter={handleSelectMatter}
            onSetMatterStatus={handleSetMatterStatus}
            onAdvanceMatterStatus={handleAdvanceMatterStatus}
          />
          <LocalScienceWorkbenchPanel
            capabilities={localScienceCapabilities}
            selectedFieldName={selectedField.name}
          />
          <ExperimentPlanPanel
            plan={defaultExperimentPlan}
            matter={selectedMatter}
          />
          <ExperimentNotebookPanel entries={experimentNotebookEntries} />
          <ResearchDataAnalysisPanel analysis={researchDataAnalysisSnapshot} />
          <ResearchWritingPanel
            tasks={researchWritingTasks}
            selectedTaskId={workspaceState.selectedWritingTaskId}
            onSelectTask={handleSelectWritingTask}
          />
        </div>
      </div>
    </div>
  )
}
