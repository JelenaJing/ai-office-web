import { useMemo, useState } from 'react'
import styled from 'styled-components'
import type { FileEntry } from '../../../platform'
import {
  formatAcademicOutlineText,
  parseAcademicOutlineText,
  previewAcademicWritingOutline,
  type AcademicWritingPaperType,
} from '../services/academicWritingWorkflow'

const Panel = styled.section`
  border: 1px solid #d8e3ef;
  border-radius: 16px;
  background: #fff;
  padding: 14px;
  display: grid;
  gap: 10px;
`

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  color: #1e3954;
`

const Description = styled.div`
  font-size: 12px;
  color: #6b7f92;
  line-height: 1.6;
`

const Field = styled.label`
  display: grid;
  gap: 5px;
  font-size: 12px;
  color: #516679;
  font-weight: 700;
`

const Input = styled.input`
  height: 34px;
  border-radius: 10px;
  border: 1px solid #d4deea;
  padding: 0 10px;
  font: inherit;
  color: #1f3448;
  background: #f9fbfd;
`

const Select = styled.select`
  height: 34px;
  border-radius: 10px;
  border: 1px solid #d4deea;
  padding: 0 10px;
  font: inherit;
  color: #1f3448;
  background: #f9fbfd;
`

const TextArea = styled.textarea`
  min-height: 72px;
  border-radius: 10px;
  border: 1px solid #d4deea;
  padding: 8px 10px;
  resize: vertical;
  font: inherit;
  line-height: 1.55;
  color: #1f3448;
  background: #f9fbfd;
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid ${({ $primary }) => ($primary ? '#77a9df' : '#d3dfeb')};
  background: ${({ $primary }) => ($primary ? 'linear-gradient(180deg, #6aa4e2 0%, #4b8fd7 100%)' : '#f8fbff')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#2c547c')};
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const Meta = styled.div`
  font-size: 12px;
  color: #6b7f92;
  line-height: 1.55;
`

const ErrorText = styled.div`
  padding: 8px 10px;
  border-radius: 10px;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 12px;
  line-height: 1.5;
`

const PAPER_TYPES: Array<{ value: AcademicWritingPaperType; label: string }> = [
  { value: 'course_paper', label: '课程论文' },
  { value: 'research_report', label: '研究报告' },
  { value: 'literature_review', label: '文献综述' },
  { value: 'policy_research_report', label: '政策研究报告' },
  { value: 'business_research_report', label: '商业研究报告' },
]

export interface AcademicWritingPanelSubmit {
  topic: string
  paperType: AcademicWritingPaperType
  researchGoal?: string
  lengthHint?: string
  language: 'zh-CN' | 'en-US'
  style: 'academic' | 'formal' | 'report'
  outline: string[]
}

interface AcademicWritingPanelProps {
  disabled?: boolean
  selectedKnowledgeIds: string[]
  attachments: FileEntry[]
  onGenerate: (input: AcademicWritingPanelSubmit) => Promise<void> | void
}

export function AcademicWritingPanel({
  disabled,
  selectedKnowledgeIds,
  attachments,
  onGenerate,
}: AcademicWritingPanelProps) {
  const [paperType, setPaperType] = useState<AcademicWritingPaperType>('research_report')
  const [topic, setTopic] = useState('')
  const [researchGoal, setResearchGoal] = useState('')
  const [lengthHint, setLengthHint] = useState('3000 字左右')
  const [language, setLanguage] = useState<'zh-CN' | 'en-US'>('zh-CN')
  const [style, setStyle] = useState<'academic' | 'formal' | 'report'>('academic')
  const [outlineText, setOutlineText] = useState('')
  const [loadingOutline, setLoadingOutline] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sourceSummary = useMemo(() => {
    const parts = []
    if (selectedKnowledgeIds.length > 0) parts.push(`${selectedKnowledgeIds.length} 个知识库`)
    if (attachments.length > 0) parts.push(`${attachments.length} 个附件`)
    return parts.length > 0 ? parts.join('、') : '未选择知识来源，将生成可替换的依据占位'
  }, [attachments.length, selectedKnowledgeIds.length])

  const canSubmit = Boolean(topic.trim()) && !disabled

  const handlePreviewOutline = async () => {
    if (!topic.trim()) {
      setError('请先输入论文主题')
      return
    }
    setLoadingOutline(true)
    setError(null)
    try {
      const result = await previewAcademicWritingOutline({
        topic: topic.trim(),
        paperType,
        researchGoal: researchGoal.trim() || undefined,
        lengthHint: lengthHint.trim() || undefined,
        language,
        style,
      })
      setOutlineText(formatAcademicOutlineText(result.outline))
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成大纲失败')
    } finally {
      setLoadingOutline(false)
    }
  }

  const handleGenerate = async () => {
    if (!canSubmit) {
      setError('请先输入论文主题')
      return
    }
    setError(null)
    await onGenerate({
      topic: topic.trim(),
      paperType,
      researchGoal: researchGoal.trim() || undefined,
      lengthHint: lengthHint.trim() || undefined,
      language,
      style,
      outline: parseAcademicOutlineText(outlineText),
    })
  }

  return (
    <Panel data-testid="academic-writing-panel">
      <div style={{ display: 'grid', gap: 6 }}>
        <Title>论文 / 研究报告 workflow</Title>
        <Description>按 web DocumentWorkbench 生成：大纲、章节 blocks、引用、参考文献和知识来源都会进入 DocumentArtifact。</Description>
      </div>

      <Field>
        类型
        <Select value={paperType} onChange={(event) => setPaperType(event.target.value as AcademicWritingPaperType)} disabled={disabled}>
          {PAPER_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </Select>
      </Field>

      <Field>
        主题
        <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="例如：生成式 AI 对高校行政效率的影响" disabled={disabled} />
      </Field>

      <Field>
        研究目标
        <TextArea value={researchGoal} onChange={(event) => setResearchGoal(event.target.value)} placeholder="说明研究目标、问题意识或预期结论。" disabled={disabled} />
      </Field>

      <Row>
        <Field>
          篇幅
          <Input value={lengthHint} onChange={(event) => setLengthHint(event.target.value)} disabled={disabled} />
        </Field>
        <Field>
          语言
          <Select value={language} onChange={(event) => setLanguage(event.target.value as 'zh-CN' | 'en-US')} disabled={disabled}>
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
          </Select>
        </Field>
      </Row>

      <Field>
        风格
        <Select value={style} onChange={(event) => setStyle(event.target.value as 'academic' | 'formal' | 'report')} disabled={disabled}>
          <option value="academic">学术</option>
          <option value="formal">正式</option>
          <option value="report">报告式</option>
        </Select>
      </Field>

      <Field>
        大纲（可先生成后调整）
        <TextArea value={outlineText} onChange={(event) => setOutlineText(event.target.value)} placeholder="点击“生成大纲”，或手动输入每行一个章节。" disabled={disabled} />
      </Field>

      <Meta>知识来源：{sourceSummary}</Meta>
      {error ? <ErrorText>{error}</ErrorText> : null}

      <ButtonRow>
        <Button type="button" disabled={!canSubmit || loadingOutline} onClick={() => void handlePreviewOutline()}>
          {loadingOutline ? '生成中…' : '生成大纲'}
        </Button>
        <Button $primary type="button" disabled={!canSubmit} onClick={() => void handleGenerate()}>
          生成章节并写入文稿
        </Button>
      </ButtonRow>
    </Panel>
  )
}
