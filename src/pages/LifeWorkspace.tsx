import styled from 'styled-components'
import { Globe, PenLine, Palette, Microscope } from 'lucide-react'
import { useWorkspaceMode } from '../contexts/WorkspaceModeContext'
import { SceneFeatureRow } from '../components/scene/SceneFeatureRow'
import { runWebFeatureAction, sceneStatusForWebFeature } from '../platform/useWebFeatureAction'
import { logWebWorkbenchEntry } from '../platform/webWorkbenchDebug'

interface LifeWorkspaceProps {
  onGoToWorkspace: () => void
}

const Page = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  background: #fdf8f4;
  padding: 40px 56px;
`

const PageHeader = styled.div`
  margin-bottom: 28px;
  flex-shrink: 0;
`

const PageTitle = styled.h1`
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 800;
  color: #2d1f0f;
`

const PageSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #8a6f58;
`

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
`

export default function LifeWorkspace({ onGoToWorkspace }: LifeWorkspaceProps) {
  const {
    enterAiForumMode,
    enterFreeMode,
    enterImageGenerationMode,
    enterDailyFeedMode,
  } = useWorkspaceMode()

  const go = (fn: () => void) => { fn(); onGoToWorkspace() }
  const block = () => {}
  const enterFeature = (feature: string, method: string, fn: () => void) => {
    logWebWorkbenchEntry(feature, { method, scene: 'life' })
    go(fn)
  }

  return (
    <Page>
      <PageHeader>
        <PageTitle>生活场景</PageTitle>
        <PageSubtitle>AI 论坛、轻量写作、图片创作与科学资讯</PageSubtitle>
      </PageHeader>

      <FeatureList>
        <SceneFeatureRow
          icon={<Globe size={24} />}
          title="AI 论坛"
          description="连接在线社区，浏览和参与讨论内容"
          accent="orange"
          status={sceneStatusForWebFeature('knowledge')}
          actionLabel="打开论坛"
          onClick={() => runWebFeatureAction('knowledge', () => go(enterAiForumMode), block)}
        />
        <SceneFeatureRow
          icon={<PenLine size={24} />}
          title="轻量写作"
          description="自由写作、随笔和日常表达，轻松记录想法"
          accent="orange"
          status={sceneStatusForWebFeature('docx.generate')}
          actionLabel="开始写作"
          onClick={() => runWebFeatureAction('docx.generate', () => enterFeature('轻量写作', 'enterFreeMode', enterFreeMode), block)}
        />
        <SceneFeatureRow
          icon={<Palette size={24} />}
          title="图片创作"
          description="生成生活图片、头像、海报和创意图"
          accent="orange"
          status={sceneStatusForWebFeature('image.generate')}
          actionLabel="创作图片"
          onClick={() => runWebFeatureAction('image.generate', () => enterFeature('图片创作', 'enterImageGenerationMode', enterImageGenerationMode), block)}
        />
        <SceneFeatureRow
          icon={<Microscope size={24} />}
          title="科学资讯"
          description="浏览最新科研动态，阅读科学解读文章（需要网络连接）"
          accent="orange"
          status={sceneStatusForWebFeature('knowledge')}
          actionLabel="科学资讯"
          onClick={() => runWebFeatureAction('knowledge', () => go(enterDailyFeedMode), block)}
        />
      </FeatureList>
    </Page>
  )
}
