import { useEffect, useMemo, useState } from 'react'
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
  researchIdeaCards,
  researchPaperRefs,
  researchWritingTasks,
} from './mockResearchData'
import type {
  ResearchMatter,
  ResearchMatterStatus,
  ResearchSubscription,
  ResearchWorkspaceState,
} from './types'
import ResearchHomeHeader from './components/ResearchHomeHeader'
import SubjectSelectionPanel from './components/SubjectSelectionPanel'
import ResearchSubscriptionPanel from './components/ResearchSubscriptionPanel'
import PersonalKnowledgePanel from './components/PersonalKnowledgePanel'
import DailyResearchReportPanel from './components/DailyResearchReportPanel'
import ScienceRelayFeed from './components/ScienceRelayFeed'
import ResearchAssistantPanel from './components/ResearchAssistantPanel'
import LocalScienceWorkbenchPanel from './components/LocalScienceWorkbenchPanel'
import ExperimentPlanPanel from './components/ExperimentPlanPanel'
import ExperimentNotebookPanel from './components/ExperimentNotebookPanel'
import ResearchDataAnalysisPanel from './components/ResearchDataAnalysisPanel'
import ResearchWritingPanel from './components/ResearchWritingPanel'

const RESEARCH_WORKSPACE_STORAGE_KEY = 'aios_research_workspace_state'

const matterStatusFlow: ResearchMatterStatus[] = [
  'idea',
  'reading',
  'planning',
  'experimenting',
  'analyzing',
  'writing',
  'completed',
]

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
    const selectedIdeaId = researchIdeaCards.some(idea => idea.id === parsed.selectedIdeaId)
      ? parsed.selectedIdeaId!
      : defaultState.selectedIdeaId
    const selectedMatterId = matters.some(matter => matter.id === parsed.selectedMatterId)
      ? parsed.selectedMatterId!
      : matters[0].id
    const selectedWritingTaskId = researchWritingTasks.some(task => task.id === parsed.selectedWritingTaskId)
      ? parsed.selectedWritingTaskId!
      : defaultState.selectedWritingTaskId

    return {
      selectedFieldId,
      selectedIdeaId,
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

  useEffect(() => {
    localStorage.setItem(RESEARCH_WORKSPACE_STORAGE_KEY, JSON.stringify(workspaceState))
  }, [workspaceState])

  const selectedField = useMemo(
    () => researchFields.find(field => field.id === workspaceState.selectedFieldId) ?? researchFields[0],
    [workspaceState.selectedFieldId],
  )

  const prioritizedIdeas = useMemo(() => {
    return [...researchIdeaCards].sort((ideaA, ideaB) => {
      const scoreA = Number(ideaA.field === selectedField.name)
      const scoreB = Number(ideaB.field === selectedField.name)
      return scoreB - scoreA
    })
  }, [selectedField.name])

  const selectedIdea = useMemo(
    () => researchIdeaCards.find(idea => idea.id === workspaceState.selectedIdeaId) ?? prioritizedIdeas[0] ?? null,
    [prioritizedIdeas, workspaceState.selectedIdeaId],
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
    const idea = researchIdeaCards.find(item => item.id === ideaId)
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
        ideaCount={researchIdeaCards.length}
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
          <ScienceRelayFeed
            ideas={prioritizedIdeas}
            selectedIdeaId={selectedIdea?.id ?? ''}
            onSelectIdea={handleSelectIdea}
            onConvertIdea={handleConvertIdeaToMatter}
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
