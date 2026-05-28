import React from 'react'
import { Briefcase, BookOpen, Heart, RefreshCw, Brain } from 'lucide-react'
import styled from 'styled-components'
import { useWorkspace } from '../contexts/WorkspaceContext'
import type { PrimarySection } from '../components/nav/PrimaryNav'
import { PRODUCT_FEATURES } from '../config/productFeatures'
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

interface HomeDashboardProps {
  onNavigate: (section: PrimarySection) => void
}

const WorkspaceBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 32px;
  padding: 14px 24px;
  background: #ffffff;
  border: 1px solid #dde6f0;
  border-radius: 12px;
  width: 100%;
`

const WorkspaceLabel = styled.span`
  font-size: 14px;
  color: #6b7f94;
  flex-shrink: 0;
`

const WorkspaceName = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #1a2f47;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`

const SwitchBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border: 1px solid #c8d6e8;
  border-radius: 8px;
  background: #f4f7fb;
  color: #3d5a78;
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.13s, border-color 0.13s;
  &:hover { background: #e6f0fb; border-color: #96b8dc; }
`

interface HomeCardDef {
  featureKey: keyof Pick<typeof PRODUCT_FEATURES, 'work' | 'research' | 'learning' | 'life'>
  section: PrimarySection
  theme: EntryCardTheme
  icon: React.ReactElement
  title: string
  desc: string
}

const HOME_CARD_DEFS: HomeCardDef[] = [
  {
    featureKey: 'work',
    section: 'work',
    theme: { accent: '#1f6fd6', accentBg: '#e6f0fc', iconBg: '#deeeff' },
    icon: <Briefcase size={30} color="#1f6fd6" />,
    title: '行政',
    desc: '文稿、PPT、邮件、日程与行政协同工作台',
  },
  {
    featureKey: 'research',
    section: 'research',
    theme: { accent: '#6b46c1', accentBg: '#efe8ff', iconBg: '#e8ddff' },
    icon: <Brain size={30} color="#6b46c1" />,
    title: '科研',
    desc: '从学科订阅到实验规划、数据分析与写作的科研工作台',
  },
  {
    featureKey: 'learning',
    section: 'study',
    theme: { accent: '#1a7a4a', accentBg: '#e4f5ec', iconBg: '#d5f0e2' },
    icon: <BookOpen size={30} color="#1a7a4a" />,
    title: '学习',
    desc: '作业解析、课程学习与科学研究',
  },
  {
    featureKey: 'life',
    section: 'life',
    theme: { accent: '#c05c15', accentBg: '#fdf0e6', iconBg: '#fce5cf' },
    icon: <Heart size={30} color="#c05c15" />,
    title: '生活',
    desc: 'AI 论坛、轻量写作、图片创作与科学资讯',
  },
]

export default function HomeDashboard({ onNavigate }: HomeDashboardProps) {
  const { activeWorkspaceName, activeWorkspacePath, closeWorkspace } = useWorkspace()

  const visibleCards = HOME_CARD_DEFS.filter(card => PRODUCT_FEATURES[card.featureKey])

  return (
    <ScenarioEntryPage>
      <ScenarioEntryHeader>
        <ScenarioEntryTitle>CUHK-Shenzhen（AI）</ScenarioEntryTitle>
        <ScenarioEntrySubtitle>
          CUHK-Shenzhen (AI) 是一个覆盖香港中文大学（深圳）行政、科研及教学等主要业务的 AI 平台。
        </ScenarioEntrySubtitle>
      </ScenarioEntryHeader>

      <ScenarioEntryMain>
        <ScenarioEntryGrid>
          {visibleCards.map(card => (
            <ScenarioEntryCard
              key={card.featureKey}
              theme={card.theme}
              icon={card.icon}
              title={card.title}
              description={card.desc}
              onClick={() => onNavigate(card.section)}
            />
          ))}
        </ScenarioEntryGrid>

        {activeWorkspaceName && (
          <WorkspaceBar>
            <WorkspaceLabel>当前工作区：</WorkspaceLabel>
            <WorkspaceName title={activeWorkspacePath ?? undefined}>
              {activeWorkspaceName}
            </WorkspaceName>
            <SwitchBtn onClick={closeWorkspace}>
              <RefreshCw size={11} />
              切换工作区
            </SwitchBtn>
          </WorkspaceBar>
        )}
      </ScenarioEntryMain>
    </ScenarioEntryPage>
  )
}
