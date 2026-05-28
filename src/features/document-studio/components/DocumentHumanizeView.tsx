import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { ArrowLeft, ChevronDown, ChevronRight, Upload } from 'lucide-react'
import { applyDocumentPatch, fetchDocument } from '../services/documentStudioApi'
import { extractPlainTextFromEditorJson } from '../services/editorContentBridge'
import {
  createHumanizeJob,
  downloadTextFile,
  extractHumanizeUploadFile,
  logHumanizeJobDebug,
  pollHumanizeJobUntilDone,
  type HumanizeJobApiResponse,
  type HumanizeLanguage,
} from '../services/humanizeDocument'
import { goToDocumentStudioHome, persistActiveDocumentId } from '../services/documentStudioSession'
import { rememberRecentDocument } from '../services/documentStudioRecent'
import { createDocumentJob, fetchJob } from '../services/documentStudioApi'

const Page = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
`

const Top = styled.div`
  flex-shrink: 0;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
`

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
`

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`

const Tab = styled.button<{ $active?: boolean }>`
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${p => (p.$active ? '#2563eb' : '#e2e8f0')};
  background: ${p => (p.$active ? '#eff6ff' : '#fff')};
  color: ${p => (p.$active ? '#1d4ed8' : '#64748b')};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
`

const Panel = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
`

const Label = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
`

const TextArea = styled.textarea`
  width: 100%;
  min-height: 160px;
  box-sizing: border-box;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  line-height: 1.65;
  resize: vertical;
`

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  align-items: center;
`

const Btn = styled.button<{ $primary?: boolean }>`
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: ${p => (p.$primary ? 'none' : '1px solid #cbd5e1')};
  background: ${p => (p.$primary ? '#2563eb' : '#fff')};
  color: ${p => (p.$primary ? '#fff' : '#334155')};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

const FileBtn = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
`

const Compare = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`

const ResultBox = styled.pre`
  margin: 0;
  min-height: 120px;
  max-height: 320px;
  overflow: auto;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`

const ErrorText = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  color: #b91c1c;
`

const WarnText = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  color: #b45309;
  line-height: 1.5;
`

const Hint = styled.p`
  margin: 0 0 8px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
`

const StatusText = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  color: #2563eb;
`

const SuccessText = styled.p`
  margin: 8px 0 0;
  font-size: 12px;
  color: #15803d;
`

const DiagToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  border: none;
  background: none;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: #334155;
  }
`

const DiagPanel = styled.div`
  margin-top: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
`

const LangSelect = styled.select`
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #334155;
  padding: 0 8px;
`

type TabKey = 'paste' | 'document'

interface Props {
  linkedDocumentId?: string | null
  onOpenDocument: (documentId: string) => void
  onBack?: () => void
}

async function pollJobDocumentId(jobId: string): Promise<string> {
  for (let i = 0; i < 80; i++) {
    const job = await fetchJob(jobId)
    if (job.status === 'succeeded' && job.documentId) return job.documentId
    if (job.status === 'failed') throw new Error(job.error || '保存文稿失败')
    await new Promise(r => setTimeout(r, 1500))
  }
  throw new Error('保存文稿超时')
}

function pickHumanizedText(job: HumanizeJobApiResponse): string {
  return (job.result?.text || job.humanizedText || '').trim()
}

function mapUserFacingError(input: string): string {
  const msg = input || ''
  if (msg.includes('Word 解析能力未安装')) return 'Word 解析能力未安装'
  if (msg.includes('Word 文件解析失败')) return 'Word 解析失败，请检查文件格式或稍后重试。'
  if (msg.includes('humanizer Skill 未安装')) return '深度改写能力未配置'
  if (msg.includes('OpenCode')) return '深度改写暂不可用'
  return msg
}

export default function DocumentHumanizeView({ linkedDocumentId, onOpenDocument, onBack }: Props) {
  const [tab, setTab] = useState<TabKey>(linkedDocumentId ? 'document' : 'paste')
  const [sourceText, setSourceText] = useState('')
  const [resultText, setResultText] = useState('')
  const [docTitle, setDocTitle] = useState('')
  const [language, setLanguage] = useState<HumanizeLanguage>('auto')
  const [loading, setLoading] = useState(false)
  const [loadingMode, setLoadingMode] = useState<'deep' | 'quick' | null>(null)
  const [fileStatus, setFileStatus] = useState<string | null>(null)
  const [fileSuccess, setFileSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeDocId, setActiveDocId] = useState<string | null>(linkedDocumentId || null)
  const [diag, setDiag] = useState<HumanizeJobApiResponse | null>(null)
  const [diagOpen, setDiagOpen] = useState(false)

  useEffect(() => {
    if (!linkedDocumentId) return
    setActiveDocId(linkedDocumentId)
    setTab('document')
    setLoading(true)
    void fetchDocument(linkedDocumentId)
      .then(doc => {
        const text = extractPlainTextFromEditorJson(
          doc.editorJson as Record<string, unknown>,
        )
        setSourceText(text)
        setDocTitle(doc.title)
      })
      .catch(err => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [linkedDocumentId])

  const runRewrite = useCallback(
    async (strength: 'deep' | 'quick') => {
      const text = sourceText.trim()
      if (!text && tab !== 'document') {
        setError('请先输入或加载要改写的正文')
        return
      }
      const linked = activeDocId || linkedDocumentId
      if (tab === 'document' && !linked) {
        setError('请从首页打开一篇文稿后再进行改写')
        return
      }

      setLoading(true)
      setLoadingMode(strength)
      setError(null)
      setDiag(null)
      setResultText('')

      try {
        const created = await createHumanizeJob({
          inputMode: tab === 'document' && linked ? 'document' : 'text',
          text: tab === 'document' ? undefined : text,
          documentId: tab === 'document' && linked ? linked : undefined,
          options: {
            strength,
            tone: 'natural',
            preserveMeaning: true,
            preserveTerms: [],
            language,
          },
        })

        const job = await pollHumanizeJobUntilDone(created.jobId, {
          onProgress: j => setDiag(j),
        })
        setDiag(job)
        logHumanizeJobDebug(job)

        if (job.status === 'failed') {
          throw new Error(job.error || '改写失败')
        }

        const humanized = pickHumanizedText(job)
        if (!humanized) {
          throw new Error('改写未返回有效文本')
        }
        setResultText(humanized)
      } catch (err) {
        setError(mapUserFacingError(err instanceof Error ? err.message : String(err)))
      } finally {
        setLoading(false)
        setLoadingMode(null)
      }
    },
    [activeDocId, linkedDocumentId, language, sourceText, tab],
  )

  const handleFile = async (file: File) => {
    const name = file.name.toLowerCase()
    if (name.endsWith('.pdf')) {
      setError('PDF 暂未支持')
      return
    }
    if (!name.endsWith('.txt') && !name.endsWith('.md') && !name.endsWith('.docx')) {
      setError('仅支持 .txt / .md / .docx')
      return
    }

    setError(null)
    setFileSuccess(null)

    try {
      let text: string
      if (name.endsWith('.docx')) {
        setFileStatus('正在上传 Word…')
        setFileStatus('正在解析 Word…')
        const extracted = await extractHumanizeUploadFile(file)
        text = extracted.markdown || extracted.text
        setSourceText(text.trim())
        if (!docTitle && file.name) {
          setDocTitle(file.name.replace(/\.docx$/i, ''))
        }
        setFileStatus(null)
        setFileSuccess('Word 已解析，可开始改写')
      } else {
        setFileStatus('正在上传文件…')
        text = await file.text()
        setSourceText(text.trim())
        if (!docTitle && file.name) {
          setDocTitle(file.name.replace(/\.(md|txt)$/i, ''))
        }
        setFileStatus(null)
        setFileSuccess('文件已载入，可开始改写')
      }
    } catch (err) {
      setFileStatus(null)
      setFileSuccess(null)
      const msg = err instanceof Error ? err.message : String(err)
      setError(mapUserFacingError(name.endsWith('.docx') ? msg : msg || '文件读取失败'))
    }
  }

  const handleSaveAsDocument = async () => {
    const text = (resultText || sourceText).trim()
    if (!text) return
    setLoading(true)
    setError(null)
    try {
      const job = await createDocumentJob({
        documentType: 'general',
        capabilityId: 'generate-general-document',
        fields: {
          topic: docTitle || '改写文稿',
          requirements: `将下列正文整理为一篇结构清晰的文稿，保留原意：\n\n${text.slice(0, 12000)}`,
          wordCount: String(Math.min(4000, Math.max(300, text.length))),
        },
      })
      const documentId = await pollJobDocumentId(job.jobId)
      rememberRecentDocument({ documentId, title: docTitle || '改写文稿' })
      persistActiveDocumentId(documentId)
      onOpenDocument(documentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleReplaceDocument = async () => {
    if (!activeDocId || !resultText.trim()) return
    setLoading(true)
    setError(null)
    try {
      await applyDocumentPatch(activeDocId, {
        type: 'replace_document',
        text: resultText,
        summary: ['已通过 AI 改写替换全文'],
      })
      onOpenDocument(activeDocId)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (onBack) onBack()
    else goToDocumentStudioHome()
  }

  const changeRatio = diag?.changeRatio ?? 0
  const usedFallback = Boolean(diag?.usedFallback)
  const channel = diag?.channel || (usedFallback ? '备用通道' : '—')
  const deepReady = Boolean(
    diag &&
      !usedFallback &&
      (diag.channel === '深度改写' || (diag.source || '').includes('opencode')),
  )

  const languageSelect = (
    <label style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
      输出语言
      <LangSelect value={language} onChange={e => setLanguage(e.target.value as HumanizeLanguage)}>
        <option value="auto">自动保持原文语言</option>
        <option value="zh-CN">输出中文</option>
        <option value="en-US">输出英文</option>
      </LangSelect>
    </label>
  )

  return (
    <Page>
      <Top>
        <BackBtn type="button" onClick={handleBack}>
          <ArrowLeft size={16} /> 返回首页
        </BackBtn>
        <Title>AI 改写</Title>
        <Tabs>
          <Tab type="button" $active={tab === 'paste'} onClick={() => setTab('paste')}>
            文本 / 文件
          </Tab>
          <Tab
            type="button"
            $active={tab === 'document'}
            onClick={() => setTab('document')}
            disabled={!linkedDocumentId && !activeDocId}
          >
            当前文稿
          </Tab>
        </Tabs>
      </Top>

      <Body>
        {tab === 'paste' ? (
          <Panel>
            <Label>原文</Label>
            <Hint>
              粘贴文本、上传文件，或选择已有文稿，对内容进行自然化改写、表达优化和重复表达整理。
            </Hint>
            <Hint>支持 .txt / .md / .docx · PDF 暂未支持</Hint>
            {diag ? (
              <Hint>{deepReady ? '深度改写能力可用' : '深度改写暂不可用'}</Hint>
            ) : (
              <Hint>正在准备改写能力</Hint>
            )}
            <TextArea
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              placeholder="粘贴需要改写的正文…"
            />
            <Row>
              {languageSelect}
              <FileBtn>
                <Upload size={14} /> 上传文件
                <input
                  type="file"
                  accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  hidden
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) void handleFile(f)
                    e.target.value = ''
                  }}
                />
              </FileBtn>
              <Btn type="button" disabled={loading} onClick={() => void runRewrite('quick')}>
                {loadingMode === 'quick' ? '快速改写中…' : '快速改写'}
              </Btn>
              <Btn type="button" $primary disabled={loading} onClick={() => void runRewrite('deep')}>
                {loadingMode === 'deep' ? '深度改写中…' : '开始深度改写'}
              </Btn>
            </Row>
            {fileStatus ? <StatusText>{fileStatus}</StatusText> : null}
            {fileSuccess ? <SuccessText>{fileSuccess}</SuccessText> : null}
          </Panel>
        ) : (
          <Panel>
            <Label>当前文稿{docTitle ? `：${docTitle}` : ''}</Label>
            <Hint>
              {linkedDocumentId || activeDocId
                ? '对已打开文稿的全文进行改写；完成后可替换全文或另存。'
                : '请从首页打开一篇文稿后再使用当前文稿改写'}
            </Hint>
            <TextArea value={sourceText} onChange={e => setSourceText(e.target.value)} />
            <Row>
              {languageSelect}
              <Btn type="button" disabled={loading} onClick={() => void runRewrite('quick')}>
                {loadingMode === 'quick' ? '快速改写中…' : '快速改写'}
              </Btn>
              <Btn type="button" $primary disabled={loading} onClick={() => void runRewrite('deep')}>
                {loadingMode === 'deep' ? '深度改写中…' : '开始深度改写'}
              </Btn>
              {activeDocId ? (
                <Btn type="button" onClick={() => onOpenDocument(activeDocId)}>
                  打开编辑器
                </Btn>
              ) : null}
            </Row>
          </Panel>
        )}

        <Panel>
          <Label>改写结果</Label>
          <Compare>
            <div>
              <Hint>原文</Hint>
              <ResultBox>{sourceText || '（暂无）'}</ResultBox>
            </div>
            <div>
              <Hint>改写后</Hint>
              <ResultBox>{resultText || '（改写完成后显示）'}</ResultBox>
            </div>
          </Compare>

          {diag ? (
            <>
              <DiagToggle type="button" onClick={() => setDiagOpen(v => !v)}>
                {diagOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                执行诊断
              </DiagToggle>
              {diagOpen ? (
                <DiagPanel>
                  <div>通道：{channel}</div>
                  <div>是否使用备用通道：{usedFallback ? '是' : '否'}</div>
                  <div>
                    改写幅度：
                    {typeof changeRatio === 'number' ? `${(changeRatio * 100).toFixed(1)}%` : '—'}
                  </div>
                  <div>原文字数：{diag.originalLength ?? '—'}</div>
                  <div>改写后字数：{diag.humanizedLength ?? '—'}</div>
                  <div>语言检测（原文）：{diag.detectedLanguage ?? '—'}</div>
                  <div>语言检测（改写后）：{diag.outputLanguage ?? '—'}</div>
                </DiagPanel>
              ) : null}
              {usedFallback ? (
                <WarnText>本次使用了备用通道，改写质量可能低于深度改写。</WarnText>
              ) : null}
              {typeof changeRatio === 'number' && changeRatio < 0.05 && resultText ? (
                <WarnText>改写幅度较低，建议尝试深度改写或调整输出语言设置。</WarnText>
              ) : null}
            </>
          ) : null}

          <Row>
            <Btn
              type="button"
              disabled={!resultText}
              onClick={() => void navigator.clipboard.writeText(resultText)}
            >
              复制结果
            </Btn>
            <Btn
              type="button"
              disabled={!resultText}
              onClick={() => downloadTextFile('改写结果.md', resultText, 'text/markdown;charset=utf-8')}
            >
              下载 Markdown
            </Btn>
            <Btn type="button" disabled title="下载 Word（待接入）">
              下载 Word（待接入）
            </Btn>
            <Btn type="button" disabled={!resultText} onClick={() => void handleSaveAsDocument()}>
              保存为新文稿
            </Btn>
            {(activeDocId || linkedDocumentId) && resultText ? (
              <>
                <Btn type="button" onClick={() => void handleReplaceDocument()}>
                  替换全文
                </Btn>
                <Btn
                  type="button"
                  onClick={() => {
                    const id = activeDocId || linkedDocumentId
                    if (!id || !resultText.trim()) return
                    void (async () => {
                      setLoading(true)
                      try {
                        const job = await createDocumentJob({
                          documentType: 'general',
                          capabilityId: 'generate-general-document',
                          fields: {
                            topic: `${docTitle || '文稿'}（改写副本）`,
                            requirements: `基于下列改写后正文生成一篇新文稿：\n\n${resultText.slice(0, 12000)}`,
                            wordCount: String(Math.min(4000, Math.max(300, resultText.length))),
                          },
                        })
                        const newId = await pollJobDocumentId(job.jobId)
                        rememberRecentDocument({
                          documentId: newId,
                          title: `${docTitle || '文稿'}（改写副本）`,
                        })
                        onOpenDocument(newId)
                      } catch (err) {
                        setError(err instanceof Error ? err.message : String(err))
                      } finally {
                        setLoading(false)
                      }
                    })()
                  }}
                >
                  另存为新文稿
                </Btn>
              </>
            ) : null}
          </Row>
          {error ? <ErrorText>{error}</ErrorText> : null}
        </Panel>
      </Body>
    </Page>
  )
}
