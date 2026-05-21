import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import DocumentEngineHost from '../modules/writing/components/DocumentEngineHost'
import WebWritingPanel from '../modules/writing/components/WebWritingPanel'
import GenerationWorkbenchPanel from '../modules/generation/components/GenerationWorkbenchPanel'
import CommunicationWorkbench from '../communication/CommunicationWorkbench'
import HomeworkWorkbench from '../modules/homework/components/HomeworkWorkbench'
import AiClassWorkbench from '../modules/homework/components/AiClassWorkbench'
import AiForumWorkbench from '../modules/homework/components/AiForumWorkbench'
import ExcelAnalysisWorkbench from '../modules/excel-analysis/components/ExcelAnalysisWorkbench'
import DailyFeedWorkbench from '../modules/feed/components/DailyFeedWorkbench'
import ModelDevPanel from './ModelDevPanel'
import WebFeatureComingSoon from './WebFeatureComingSoon'
import { useWorkspaceMode } from '../contexts/WorkspaceModeContext'
import { isWebShim } from '../platform/detect'
import { isWebFeatureEnabled } from '../platform/featureGate'
import type { WebFeatureKey } from '../platform/featureGate'

const GenerationShell = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fbfe 0%, #eef4f9 100%);
`

const ViewportBody = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  overflow: hidden;
`

const EditorViewportShell = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
`

const ViewportSlot = styled.div<{ $active: boolean }>`
  ${({ $active }) => $active
    ? 'flex: 1; min-width: 0; min-height: 0; display: flex; overflow: hidden;'
    : 'display: none;'}
`

type PanelKey =
  | 'freewrite' | 'paper' | 'workbench' | 'email' | 'homework' | 'ai-class' | 'ai-forum'
  | 'data' | 'model' | 'daily-feed' | 'image'

const PANEL_WEB_FEATURE: Partial<Record<PanelKey, WebFeatureKey>> = {
  freewrite: 'docx.generate',
  paper: 'daily.report',
  workbench: 'ppt.generate',
  email: 'email',
  data: 'excel.analysis',
  model: 'settings.ai',
  image: 'image.generate',
}

function resolvePanelKey(mode: string, generationMode: string): PanelKey {
  if (mode === 'free') return 'freewrite'
  if (generationMode === 'document' || generationMode === 'daily-report') return 'paper'
  if (generationMode === 'image') return 'image'
  if (generationMode === 'email') return 'email'
  if (generationMode === 'homework') return 'homework'
  if (generationMode === 'ai-class') return 'ai-class'
  if (generationMode === 'ai-forum') return 'ai-forum'
  if (generationMode === 'data') return 'data'
  if (generationMode === 'model') return 'model'
  if (generationMode === 'daily-feed') return 'daily-feed'
  return 'workbench'
}

function renderPanelContent(
  key: PanelKey,
  ghostTextEnabled: boolean,
  activePanel: PanelKey,
): React.ReactNode {
  if (isWebShim()) {
    const featureKey = PANEL_WEB_FEATURE[key]
    if (featureKey && !isWebFeatureEnabled(featureKey)) {
      return <WebFeatureComingSoon featureKey={featureKey} />
    }
    if (key === 'homework') return <WebFeatureComingSoon title="作业辅助" />
    if (key === 'ai-class') return <WebFeatureComingSoon title="AI 课堂" />
    if (key === 'ai-forum') return <WebFeatureComingSoon title="AI 论坛" />
    if (key === 'daily-feed') return <WebFeatureComingSoon title="科学资讯" />
  }

  switch (key) {
    case 'freewrite':
      return isWebShim() ? (
        <WebWritingPanel />
      ) : (
        <EditorViewportShell>
          <DocumentEngineHost ghostTextEnabled={ghostTextEnabled} manuscriptProfile="freewrite" active={activePanel === 'freewrite'} />
        </EditorViewportShell>
      )
    case 'paper':
      return (
        <EditorViewportShell>
          <DocumentEngineHost ghostTextEnabled={ghostTextEnabled} manuscriptProfile="paper" active={activePanel === 'paper'} />
        </EditorViewportShell>
      )
    case 'workbench':
      return (
        <GenerationShell>
          <ViewportBody>
            <GenerationWorkbenchPanel />
          </ViewportBody>
        </GenerationShell>
      )
    case 'email':
      return <CommunicationWorkbench />
    case 'homework':
      return (
        <GenerationShell>
          <HomeworkWorkbench />
        </GenerationShell>
      )
    case 'ai-class':
      return <AiClassWorkbench />
    case 'ai-forum':
      return <AiForumWorkbench />
    case 'data':
      return <ExcelAnalysisWorkbench />
    case 'model':
      return <ModelDevPanel />
    case 'daily-feed':
      return <DailyFeedWorkbench />
    default:
      return null
  }
}

interface WorkspaceViewportHostProps {
  ghostTextEnabled: boolean
}

export default function WorkspaceViewportHost({ ghostTextEnabled }: WorkspaceViewportHostProps) {
  const { mode, generationMode, setGenerationMode } = useWorkspaceMode()
  const activePanel = resolvePanelKey(mode, generationMode)

  useEffect(() => {
    const handler = () => setGenerationMode('email')
    window.addEventListener('open-communication-workbench', handler)
    return () => window.removeEventListener('open-communication-workbench', handler)
  }, [setGenerationMode])

  const mountedRef = useRef<Set<PanelKey>>(new Set())
  mountedRef.current.add(activePanel)
  const mounted = (key: PanelKey) => mountedRef.current.has(key)

  const panelKeys: PanelKey[] = [
    'freewrite', 'paper', 'workbench', 'email', 'homework',
    'ai-class', 'ai-forum', 'data', 'model', 'daily-feed', 'image',
  ]

  return (
    <>
      {panelKeys.map(key => (
        <ViewportSlot key={key} $active={activePanel === key}>
          {mounted(key) && renderPanelContent(key, ghostTextEnabled, activePanel)}
        </ViewportSlot>
      ))}
    </>
  )
}
