import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { FilePlus, Paperclip, Send, X } from 'lucide-react'
import VoiceInputMicButton from '../../../components/voice/VoiceInputMicButton'
import { useMeetingSpeechInput } from '../../../hooks/useMeetingSpeechInput'
import {
  DOCUMENT_TASK_TEMPLATES,
  type DocumentTaskTemplate,
  type DocumentTone,
} from '../services/documentTaskTemplates'
import type { StudioAttachment } from '../services/documentStudioMaterials'

const Page = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
`

const Scroll = styled.div`
  flex: 1;
  overflow: auto;
`

const Inner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 32px 56px;
`

const Eyebrow = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
`

const Title = styled.h1`
  margin: 0 0 28px;
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
`

const PromptCard = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
  margin-bottom: 32px;
`

const PromptLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 10px;
`

const PromptArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  border: none;
  resize: vertical;
  font-size: 16px;
  line-height: 1.65;
  color: #0f172a;
  font-family: inherit;
  outline: none;
  &::placeholder {
    color: #94a3b8;
  }
`

const MaterialActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
`

const Hint = styled.div`
  margin-top: 10px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
`

const WarnHint = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: #b45309;
  line-height: 1.5;
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #334155;
`

const ChipRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
`

const PromptFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
`

const LeftActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`

const VoiceHint = styled.span`
  font-size: 12px;
  color: #64748b;
  max-width: 280px;
  line-height: 1.45;
`

const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const GhostBtn = styled.button`
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover {
    border-color: #94a3b8;
    background: #f8fafc;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ToneSelect = styled.select`
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 13px;
  color: #334155;
`

const PrimaryBtn = styled.button`
  height: 38px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const TaskHint = styled.div`
  font-size: 13px;
  color: #475569;
  margin-bottom: 16px;
  strong {
    color: #0f172a;
    font-weight: 700;
  }
`

const SectionTitle = styled.h2`
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
`

const TemplateCard = styled.button<{ $active?: boolean }>`
  text-align: left;
  padding: 18px 18px 16px;
  border-radius: 14px;
  border: 1px solid ${({ $active }) => ($active ? '#3b82f6' : '#e2e8f0')};
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  box-shadow: ${({ $active }) => ($active ? '0 8px 24px rgba(59, 130, 246, 0.12)' : 'none')};
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }
`

const CardName = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
`

const CardDesc = styled.div`
  font-size: 13px;
  color: #64748b;
  line-height: 1.55;
  margin-bottom: 12px;
  min-height: 40px;
`

const CardMeta = styled.div`
  font-size: 12px;
  color: #94a3b8;
`

const TONE_OPTIONS: Array<{ value: DocumentTone; label: string }> = [
  { value: 'formal', label: '正式' },
  { value: 'concise', label: '简洁' },
  { value: 'academic', label: '学术' },
  { value: 'business', label: '商务' },
]

interface Props {
  prompt: string
  tone: DocumentTone
  selectedTemplate: DocumentTaskTemplate | null
  busy?: boolean
  knowledgeLabels: string[]
  attachments: StudioAttachment[]
  onPromptChange: (value: string) => void
  onToneChange: (tone: DocumentTone) => void
  onSelectTemplate: (template: DocumentTaskTemplate) => void
  onCreateBlank: () => void
  onSubmit: () => void
  onOpenKnowledgePicker: () => void
  onClearKnowledge: () => void
  onRemoveKnowledge: (label: string) => void
  onUploadMaterials: (files: FileList | File[]) => void
  onRemoveAttachment: (id: string) => void
}

export default function DocumentStudioWelcomeView({
  prompt,
  tone,
  selectedTemplate,
  busy,
  knowledgeLabels,
  attachments,
  onPromptChange,
  onToneChange,
  onSelectTemplate,
  onCreateBlank,
  onSubmit,
  onOpenKnowledgePicker,
  onClearKnowledge,
  onRemoveKnowledge,
  onUploadMaterials,
  onRemoveAttachment,
}: Props) {
  const promptRef = useRef<HTMLTextAreaElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [voiceStatus, setVoiceStatus] = useState('')
  const voice = useMeetingSpeechInput({
    getBaseText: () => prompt,
    setText: onPromptChange,
    onStatus: setVoiceStatus,
  })

  const focusPrompt = useCallback(() => {
    promptRef.current?.focus()
  }, [])

  useEffect(() => {
    if (selectedTemplate) focusPrompt()
  }, [selectedTemplate, focusPrompt])

  const handleSelectTemplate = (template: DocumentTaskTemplate) => {
    onSelectTemplate(template)
    if (!prompt.trim()) {
      onPromptChange(template.examplePrompt)
    }
    focusPrompt()
  }

  return (
    <Page>
      <Scroll>
        <Inner>
          <Eyebrow>AI Office / 文稿</Eyebrow>
          <Title>今天想写什么文稿？</Title>

          <PromptCard>
            <PromptLabel>输入你要生成的文稿要求</PromptLabel>
            <PromptArea
              ref={promptRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="例如：帮我写一份面向学校领导的 AI Office 项目汇报"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  onSubmit()
                }
              }}
            />

            <MaterialActions>
              <GhostBtn type="button" disabled={busy} onClick={onOpenKnowledgePicker}>
                选择知识库
              </GhostBtn>
              <GhostBtn
                type="button"
                disabled={busy}
                onClick={() => uploadInputRef.current?.click()}
              >
                <Paperclip size={15} />
                上传材料
              </GhostBtn>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".docx,.txt,.md,.markdown,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.length) {
                    onUploadMaterials(e.target.files)
                    e.target.value = ''
                  }
                }}
              />
            </MaterialActions>

            <Hint>用于补充材料和引用依据。支持 Word、文本和 Markdown；PDF 暂未支持正文抽取。</Hint>

            {knowledgeLabels.length > 0 ? (
              <ChipRow>
                {knowledgeLabels.map((label) => (
                  <Chip key={label}>
                    {label}
                    <ChipRemove type="button" aria-label="移除" onClick={() => onRemoveKnowledge(label)}>
                      <X size={12} />
                    </ChipRemove>
                  </Chip>
                ))}
                <GhostBtn type="button" style={{ height: 32, padding: '0 10px' }} onClick={onClearKnowledge}>
                  清空知识库
                </GhostBtn>
              </ChipRow>
            ) : null}

            {attachments.length > 0 ? (
              <ChipRow>
                {attachments.map((item) => (
                  <Chip key={item.id} title={item.error || undefined}>
                    {item.name}
                    {item.status === 'uploading' ? '（上传中）' : ''}
                    {item.status === 'failed' || item.status === 'unsupported' ? '（不可用）' : ''}
                    <ChipRemove type="button" aria-label="删除" onClick={() => onRemoveAttachment(item.id)}>
                      <X size={12} />
                    </ChipRemove>
                  </Chip>
                ))}
              </ChipRow>
            ) : null}

            {attachments.some((item) => item.status === 'unsupported') ? (
              <WarnHint>PDF 暂未支持正文抽取，可先转换为 Word 或文本后上传。</WarnHint>
            ) : null}

            <PromptFooter>
              <LeftActions>
                <GhostBtn type="button" onClick={onCreateBlank} disabled={busy}>
                  <FilePlus size={15} />
                  创建空白
                </GhostBtn>
                <VoiceInputMicButton
                  listening={voice.listening}
                  supported={voice.supported}
                  disabled={busy}
                  onClick={() => void voice.toggle()}
                />
                {voiceStatus ? <VoiceHint>{voiceStatus}</VoiceHint> : null}
              </LeftActions>
              <RightActions>
                <ToneSelect value={tone} onChange={(e) => onToneChange(e.target.value as DocumentTone)}>
                  {TONE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </ToneSelect>
                <PrimaryBtn type="button" disabled={busy || !prompt.trim()} onClick={onSubmit}>
                  <Send size={15} />
                  开始生成
                </PrimaryBtn>
              </RightActions>
            </PromptFooter>
          </PromptCard>

          {selectedTemplate ? (
            <TaskHint>
              当前任务：<strong>{selectedTemplate.name}</strong>
            </TaskHint>
          ) : null}

          <SectionTitle>选择文稿类型</SectionTitle>
          <Grid>
            {DOCUMENT_TASK_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                type="button"
                $active={selectedTemplate?.id === template.id}
                onClick={() => handleSelectTemplate(template)}
              >
                <CardName>{template.name}</CardName>
                <CardDesc>{template.description}</CardDesc>
                <CardMeta>{template.category}</CardMeta>
              </TemplateCard>
            ))}
          </Grid>
        </Inner>
      </Scroll>
    </Page>
  )
}
