/**
 * WebWritingPanel — Web-mode document generation panel.
 *
 * Replaces the Electron Tiptap EditorPanel in web mode.
 * Calls platformApi.skills.run('web.docx.create', ...) and saves the result
 * to the artifact system (accessible in 资源中心 › 生成记录).
 */

import { useState } from 'react'
import styled from 'styled-components'
import { Sparkles, Download, FileText, ArrowRight } from 'lucide-react'
import { useWorkspace } from '../../../contexts/WorkspaceContext'
import { platformApi } from '../../../platform'
import type { Artifact } from '../../../platform'

// ── Styled components ─────────────────────────────────────────────────────────

const Wrap = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 48px 32px 32px;
  background: linear-gradient(180deg, #f7fafd 0%, #eef4f9 100%);
  overflow-y: auto;
`

const Card = styled.div`
  width: 100%;
  max-width: 640px;
  background: #ffffff;
  border: 1px solid #e2eaf5;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(20, 40, 80, 0.07);
  overflow: hidden;
`

const CardHeader = styled.div`
  padding: 24px 28px 20px;
  border-bottom: 1px solid #f0f4f8;
  background: #fafdff;
`

const CardTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 800;
  color: #1a2f47;
  display: flex;
  align-items: center;
  gap: 8px;
`

const CardSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b84a0;
  line-height: 1.5;
`

const CardBody = styled.div`
  padding: 24px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`

const FieldLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #4a5f73;
  margin-bottom: 7px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const TextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #c8d8e8;
  border-radius: 8px;
  font-size: 14px;
  color: #1a2f47;
  outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: #1a5fb4; box-shadow: 0 0 0 3px rgba(26,95,180,0.1); }
`

const TextArea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #c8d8e8;
  border-radius: 8px;
  font-size: 13px;
  color: #1a2f47;
  outline: none;
  resize: vertical;
  line-height: 1.65;
  min-height: 120px;
  transition: border-color 0.15s;
  &:focus { border-color: #1a5fb4; box-shadow: 0 0 0 3px rgba(26,95,180,0.1); }
`

const ErrorBox = styled.div`
  padding: 10px 14px;
  border-radius: 8px;
  background: #fff0f0;
  color: #c0392b;
  font-size: 13px;
  line-height: 1.5;
`

const BtnRow = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  align-items: center;
`

const PrimaryBtn = styled.button<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 22px;
  background: ${p => p.$disabled ? '#8ca8c8' : '#1a5fb4'};
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #1750a0; }
`

const SecondaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: #f0f5fb;
  color: #304255;
  border: 1px solid #c8d8e8;
  border-radius: 9px;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: #e4eef8; }
`

const SuccessCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 36px 28px;
  text-align: center;
`

const SuccessEmoji = styled.div`
  font-size: 42px;
`

const SuccessTitle = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: #1a2f47;
`

const SuccessHint = styled.div`
  font-size: 12px;
  color: #8094a8;
`

const SuccessBtns = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
`

// ── Component ─────────────────────────────────────────────────────────────────

export default function WebWritingPanel() {
  const { activeWorkspacePath } = useWorkspace()

  const [title, setTitle] = useState('AI Office 文稿')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [artifact, setArtifact] = useState<Artifact | null>(null)

  const handleGenerate = async () => {
    if (!activeWorkspacePath) {
      setError('正在初始化工作空间，请稍后重试。')
      return
    }
    if (!prompt.trim()) {
      setError('请输入生成提示词')
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const result = await platformApi.skills.run('web.docx.create', {
        prompt: prompt.trim(),
        workspacePath: activeWorkspacePath,
        params: { title: title.trim() || 'AI Office 文稿' },
      })
      if (!result.success) {
        setError(result.error ?? '生成失败，请重试')
        return
      }
      if (!result.artifact) {
        setError('生成完成但未返回文稿记录，请稍后到资源中心查看')
        return
      }
      setArtifact(result.artifact)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '网络错误，请重试'
      setError(msg)
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = () => {
    setArtifact(null)
    setError(null)
    setPrompt('')
    setTitle('AI Office 文稿')
  }

  return (
    <Wrap>
      <Card>
        <CardHeader>
          <CardTitle>
            <FileText size={18} color="#1a5fb4" />
            文稿编辑
          </CardTitle>
          <CardSubtitle>
            输入标题和需求，AI 将生成 Word 文稿，结果保存到资源中心的生成记录，可随时下载。
          </CardSubtitle>
        </CardHeader>

        <CardBody>
          {artifact ? (
            <SuccessCard>
              <SuccessEmoji>✅</SuccessEmoji>
              <SuccessTitle>{artifact.title}</SuccessTitle>
              <SuccessHint>
                已保存到 资源中心 › 生成记录，刷新后仍可查看和下载。
              </SuccessHint>
              <SuccessBtns>
                <PrimaryBtn
                   onClick={() => void platformApi.artifacts.download(
                    artifact.id,
                    `${artifact.title}.docx`,
                  )}
                >
                  <Download size={15} /> 下载 DOCX
                </PrimaryBtn>
                <SecondaryBtn onClick={handleReset}>
                  <Sparkles size={13} /> 再生成一篇
                </SecondaryBtn>
              </SuccessBtns>
            </SuccessCard>
          ) : (
            <>
              {error && <ErrorBox>{error}</ErrorBox>}

              <div>
                <FieldLabel>文稿标题</FieldLabel>
                <TextInput
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="例如：Q2 项目汇报"
                  disabled={generating}
                />
              </div>

              <div>
                <FieldLabel>
                  提示词
                  <span style={{ fontWeight: 400, color: '#aab8c8', textTransform: 'none', marginLeft: 6 }}>
                    描述你想要生成的内容
                  </span>
                </FieldLabel>
                <TextArea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="例如：帮我写一份关于 Q2 销售业绩的汇报，包括数据摘要、亮点分析和下季度建议，风格正式、简洁。"
                  disabled={generating}
                  onKeyDown={e => {
                    // Ctrl/Cmd+Enter triggers generation
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      void handleGenerate()
                    }
                  }}
                />
              </div>

              <BtnRow>
                <span style={{ fontSize: 11, color: '#aab8c8' }}>Ctrl+Enter 快速生成</span>
                <PrimaryBtn
                  onClick={() => void handleGenerate()}
                  disabled={generating || !prompt.trim()}
                  $disabled={generating || !prompt.trim()}
                >
                  <Sparkles size={14} />
                  {generating ? 'AI 正在生成文稿，约需 10–60 秒…' : '生成 Word 文稿'}
                </PrimaryBtn>
              </BtnRow>

              <div style={{
                marginTop: 4, padding: '10px 14px',
                background: '#f0f7ff', borderRadius: 8,
                fontSize: 12, color: '#3a6fa0', lineHeight: 1.6,
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <ArrowRight size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                生成结果会自动保存到 <strong>资源中心 › 生成记录</strong>，可以随时下载。
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </Wrap>
  )
}
