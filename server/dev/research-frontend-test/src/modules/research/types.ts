export type ResearchRiskLevel = 'low' | 'medium' | 'high'

export type ResearchMatterStatus =
  | 'idea'
  | 'reading'
  | 'planning'
  | 'experimenting'
  | 'analyzing'
  | 'writing'
  | 'completed'

export interface ResearchField {
  id: string
  name: string
  description: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  recommendedFor: string[]
}

export interface ResearchSubscription {
  id: string
  title: string
  type: 'keyword' | 'field' | 'author' | 'conference' | 'journal'
  query: string
  enabled: boolean
  paperCount: number
  lastUpdatedAt: string
}

export interface ResearchPaperRef {
  id: string
  title: string
  authors: string[]
  venue: string
  year: number
  abstract: string
  tags: string[]
  relevanceScore: number
  /** APA-like one-line citation from OpenAlex */
  citation?: string
  doi?: string
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
  nextAction: 'read_more' | 'make_plan' | 'run_experiment' | 'write_proposal'
}

export interface ResearchMatter {
  id: string
  title: string
  field: string
  objective: string
  hypothesis: string
  sourcePaperIds: string[]
  status: ResearchMatterStatus
  createdAt: string
  updatedAt: string
  outputs: Array<'experiment_plan' | 'notebook' | 'dataset' | 'analysis_report' | 'paper_draft' | 'ppt'>
}

export interface DailyResearchReport {
  id: string
  date: string
  summary: string
  newPaperIds: string[]
  highlightedTrends: string[]
  relatedPaperIds: string[]
  researchGaps: string[]
  recommendedNextSteps: string[]
}

export interface KnowledgeUpdateItem {
  id: string
  title: string
  type: 'paper' | 'note' | 'experiment' | 'subscription'
  updatedAt: string
}

export interface PersonalKnowledgeSnapshot {
  myPapers: number
  myNotes: number
  myExperimentRecords: number
  subscribedPapers: number
  recentUpdates: KnowledgeUpdateItem[]
}

export interface ExperimentPlan {
  objective: string
  variables: string[]
  data: string[]
  steps: string[]
  risks: string[]
}

export interface ExperimentNotebookEntry {
  id: string
  date: string
  record: string
  observation: string
  nextStep: string
}

export interface ResearchDataAnalysisSnapshot {
  uploadHint: string
  analysisPlan: string[]
  chartPlaceholders: string[]
  resultSummary: string
}

export interface ResearchWritingTask {
  id: string
  label: string
  description: string
  output: 'report' | 'paper_outline' | 'ppt' | 'proposal'
}

export interface LocalScienceCapability {
  id: string
  title: string
  description: string
  status: 'ready' | 'warming' | 'offline'
  focus: string[]
}

export interface ResearchWorkspaceState {
  selectedFieldId: string
  selectedIdeaId: string
  selectedMatterId: string
  subscriptions: ResearchSubscription[]
  matters: ResearchMatter[]
  selectedWritingTaskId: string
}
