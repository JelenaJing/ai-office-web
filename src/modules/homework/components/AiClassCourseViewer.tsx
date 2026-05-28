import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import type { AiClassCourse } from '../data/aiClassCourses'

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #ffffff;
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #e8eaed;
  background: #ffffff;
  flex-shrink: 0;
`

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #dadce0;
  border-radius: 999px;
  padding: 6px 14px;
  background: #ffffff;
  color: #3c4043;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #f8f9fa;
  }
`

const Title = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  background: #ffffff;
  color: #5f6368;
  cursor: pointer;

  &:hover {
    background: #f8f9fa;
  }
`

const FrameWrap = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  background: #f8f9fa;
`

const Frame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
`

const MessagePanel = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
  background: #ffffff;
  color: #5f6368;
  font-size: 14px;
  line-height: 1.6;
`

const MessageTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
`

const CodeHint = styled.code`
  display: block;
  margin-top: 8px;
  padding: 10px 14px;
  background: #f1f3f4;
  border-radius: 8px;
  font-size: 12px;
  color: #3c4043;
  max-width: 560px;
  word-break: break-all;
`

interface AiClassCourseViewerProps {
  course: AiClassCourse
  onBack: () => void
}

export default function AiClassCourseViewer({ course, onBack }: AiClassCourseViewerProps) {
  const [frameKey, setFrameKey] = useState(0)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading')

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')
    fetch(course.entryPath, { method: 'HEAD' })
      .then(res => {
        if (cancelled) return
        setLoadState(res.ok ? 'ready' : 'missing')
      })
      .catch(() => {
        if (!cancelled) setLoadState('missing')
      })
    return () => { cancelled = true }
  }, [course.entryPath])

  return (
    <Shell>
      <TopBar>
        <BackButton type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回课程列表
        </BackButton>
        <Title>{course.title}</Title>
        <IconButton type="button" title="刷新课件" onClick={() => setFrameKey(k => k + 1)}>
          <RefreshCw size={16} />
        </IconButton>
      </TopBar>
      <FrameWrap>
        {loadState === 'missing' && (
          <MessagePanel>
            <MessageTitle>课件文件尚未部署</MessageTitle>
            <p>
              请将桌面上的「AI赋能材料化学科研四讲课程PPT_HTML包」完整复制到项目的
              <strong> public/ai-class/courses/material-chemistry-ai-lectures/ </strong>
              目录（需包含 index.html），然后刷新本页。
            </p>
            <CodeHint>
              bash scripts/sync-material-chemistry-courseware.sh &quot;课件包路径&quot;
            </CodeHint>
          </MessagePanel>
        )}
        {loadState !== 'missing' && (
          <Frame
            key={frameKey}
            src={course.entryPath}
            title={course.title}
            onLoad={() => setLoadState('ready')}
          />
        )}
        {loadState === 'loading' && (
          <MessagePanel style={{ background: 'rgba(255,255,255,0.92)' }}>
            <MessageTitle>正在加载课件…</MessageTitle>
          </MessagePanel>
        )}
      </FrameWrap>
    </Shell>
  )
}
