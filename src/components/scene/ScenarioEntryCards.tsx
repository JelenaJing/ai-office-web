import styled from 'styled-components'
import React from 'react'

/** 场景入口页（首页、行政场景等）共用页面布局 */
export const ScenarioEntryPage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f4f7fc;
  padding: 48px 64px;
`

export const ScenarioEntryHeader = styled.div`
  margin-bottom: 44px;
  text-align: center;
`

export const ScenarioEntryTitle = styled.h1`
  margin: 0 0 10px;
  font-size: 36px;
  font-weight: 800;
  color: #1a2f47;
`

export const ScenarioEntrySubtitle = styled.p`
  margin: 0;
  font-size: 16px;
  color: #6b7f94;
`

export const ScenarioEntryMain = styled.div`
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`

export const ScenarioEntryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  width: 100%;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`

export interface EntryCardTheme {
  accent: string
  accentBg: string
  iconBg: string
}

const EntryCardButton = styled.button<{ $accent: string; $accentBg: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 28px 36px;
  min-height: 200px;
  border: 1.5px solid ${p => p.$accentBg};
  border-radius: 18px;
  background: #ffffff;
  cursor: pointer;
  text-align: center;
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;

  &:hover {
    border-color: ${p => p.$accent};
    box-shadow: 0 8px 36px rgba(0,0,0,0.11);
    transform: translateY(-4px);
  }
`

const EntryCardIconWrap = styled.div<{ $bg: string }>`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${p => p.$bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
  flex-shrink: 0;
`

const EntryCardTitle = styled.div<{ $compact?: boolean }>`
  font-size: clamp(28px, 3.2vw, 32px);
  font-weight: 800;
  color: #1a2f47;
  margin-bottom: ${p => (p.$compact ? 0 : '12px')};
  line-height: 1.2;
`

const EntryCardDesc = styled.div`
  font-size: 17px;
  color: #6b7f94;
  line-height: 1.55;
  max-width: 28ch;
`

export interface ScenarioEntryCardProps {
  theme: EntryCardTheme
  icon: React.ReactElement
  title: string
  description?: string
  onClick?: () => void
}

export function ScenarioEntryCard({
  theme,
  icon,
  title,
  description,
  onClick,
}: ScenarioEntryCardProps) {
  return (
    <EntryCardButton
      type="button"
      $accent={theme.accent}
      $accentBg={theme.accentBg}
      onClick={onClick}
    >
      <EntryCardIconWrap $bg={theme.iconBg}>{icon}</EntryCardIconWrap>
      <EntryCardTitle $compact={!description}>{title}</EntryCardTitle>
      {description ? <EntryCardDesc>{description}</EntryCardDesc> : null}
    </EntryCardButton>
  )
}
