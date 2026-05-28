import React from 'react'
import { FileText, Mail, BarChart2, Presentation, CalendarClock } from 'lucide-react'
import { useWorkspaceMode } from '../contexts/WorkspaceModeContext'
import type { PrimarySection } from '../components/nav/PrimaryNav'
import { applyDocumentStudioUrl } from '../features/document-studio/services/documentStudioSession'
import {
  ScenarioEntryCard,
  ScenarioEntryGrid,
  ScenarioEntryHeader,
  ScenarioEntryMain,
  ScenarioEntryPage,
  ScenarioEntrySubtitle,
  ScenarioEntryTitle,
  type EntryCardTheme,
} from '../components/scene/ScenarioEntryCards'

interface WorkWorkspaceProps {
  onGoToWorkspace: () => void
  onNavigate: (section: PrimarySection) => void
}

interface WorkFeatureDef {
  id: string
  title: string
  theme: EntryCardTheme
  icon: React.ReactElement
  hidden?: boolean
  onActivate: (ctx: {
    onGoToWorkspace: () => void
    onNavigate: (section: PrimarySection) => void
    enterEmailMode: () => void
    enterDataMode: () => void
  }) => void
}

const WORK_FEATURE_DEFS: WorkFeatureDef[] = [
  {
    id: 'document',
    title: '文稿',
    theme: { accent: '#1f6fd6', accentBg: '#e6f0fc', iconBg: '#deeeff' },
    icon: <FileText size={30} color="#1f6fd6" />,
    onActivate: ({ onNavigate }) => {
      applyDocumentStudioUrl()
      onNavigate('document-studio')
    },
  },
  {
    id: 'email',
    title: '邮件',
    theme: { accent: '#7c4dff', accentBg: '#ede4ff', iconBg: '#ede4ff' },
    icon: <Mail size={30} color="#7c4dff" />,
    onActivate: ({ onGoToWorkspace, enterEmailMode }) => {
      enterEmailMode()
      onGoToWorkspace()
    },
  },
  {
    id: 'calendar',
    title: '日程管理',
    theme: { accent: '#4338ca', accentBg: '#e0e7ff', iconBg: '#e0e7ff' },
    icon: <CalendarClock size={30} color="#4338ca" />,
    hidden: true,
    onActivate: ({ onNavigate }) => {
      onNavigate('calendar')
    },
  },
  {
    id: 'data',
    title: '数据分析',
    theme: { accent: '#00897b', accentBg: '#d0f0ec', iconBg: '#d0f0ec' },
    icon: <BarChart2 size={30} color="#00897b" />,
    onActivate: ({ onGoToWorkspace, enterDataMode }) => {
      enterDataMode()
      onGoToWorkspace()
    },
  },
  {
    id: 'slides',
    title: 'Slides',
    theme: { accent: '#c05c15', accentBg: '#fdf0e6', iconBg: '#fce5cf' },
    icon: <Presentation size={30} color="#c05c15" />,
    onActivate: ({ onNavigate }) => {
      onNavigate('html-ppt')
    },
  },
]

export default function WorkWorkspace({ onGoToWorkspace, onNavigate }: WorkWorkspaceProps) {
  const { enterEmailMode, enterDataMode } = useWorkspaceMode()

  const visibleFeatures = WORK_FEATURE_DEFS.filter(f => !f.hidden)

  const activateCtx = {
    onGoToWorkspace,
    onNavigate,
    enterEmailMode,
    enterDataMode,
  }

  return (
    <ScenarioEntryPage>
      <ScenarioEntryHeader>
        <ScenarioEntryTitle>行政场景</ScenarioEntryTitle>
        <ScenarioEntrySubtitle>文稿、邮件、数据分析与 Slides</ScenarioEntrySubtitle>
      </ScenarioEntryHeader>

      <ScenarioEntryMain>
        <ScenarioEntryGrid>
          {visibleFeatures.map(feature => (
            <ScenarioEntryCard
              key={feature.id}
              theme={feature.theme}
              icon={feature.icon}
              title={feature.title}
              onClick={() => feature.onActivate(activateCtx)}
            />
          ))}
        </ScenarioEntryGrid>
      </ScenarioEntryMain>
    </ScenarioEntryPage>
  )
}
