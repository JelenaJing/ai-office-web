import { SectionCard } from '../../materials-research/components/common/SectionCard'
import { ResearchButton } from './ResearchUi'
import ResearchIdeaCard from './ResearchIdeaCard'
import type { ResearchIdeaCard as ResearchIdeaCardData } from '../types'

interface ScienceRelayFeedProps {
  ideas: ResearchIdeaCardData[]
  selectedIdeaId: string
  onSelectIdea: (ideaId: string) => void
  onConvertIdea: (ideaId: string) => void
  sourceText: string
  onSourceTextChange: (value: string) => void
  projectId: string
  onProjectIdChange: (value: string) => void
  fulltextMode: boolean
  onFulltextModeChange: (value: boolean) => void
  onGenerateIdeas: () => void
  generating: boolean
  generateError: string | null
  useFeedRank: boolean
  onUseFeedRankChange: (value: boolean) => void
  lastRankingInfo: string | null
  onUploadPdf: (file: File) => void
  pdfUploading: boolean
  pdfUploadMessage: string | null
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function ScienceRelayFeed({
  ideas,
  selectedIdeaId,
  onSelectIdea,
  onConvertIdea,
  sourceText,
  onSourceTextChange,
  projectId,
  onProjectIdChange,
  fulltextMode,
  onFulltextModeChange,
  onGenerateIdeas,
  generating,
  generateError,
  useFeedRank,
  onUseFeedRankChange,
  lastRankingInfo,
  onUploadPdf,
  pdfUploading,
  pdfUploadMessage,
}: ScienceRelayFeedProps) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="生成研究创意"
        subtitle="上传论文 PDF 或粘贴摘要，由后端生成 Idea 并可选智能排序。"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-medium text-slate-700">论文上传</p>
            <p className="mt-1 text-xs text-muted">上传后自动填入 project_id，可开启全文多段生成。</p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              disabled={pdfUploading}
              className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-primary/90"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) onUploadPdf(f)
                e.target.value = ''
              }}
            />
            {pdfUploadMessage && (
              <p className="mt-2 text-xs text-primary">{pdfUploadMessage}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              project_id
              <input
                className={inputClass}
                value={projectId}
                onChange={e => onProjectIdChange(e.target.value)}
                placeholder="上传 PDF 后自动填入"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              来源文本 / 摘要
              <textarea
                rows={4}
                className={inputClass}
                value={sourceText}
                onChange={e => onSourceTextChange(e.target.value)}
                placeholder="选中文本或研究摘要…"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-primary focus:ring-primary/30"
              checked={fulltextMode}
              onChange={e => onFulltextModeChange(e.target.checked)}
            />
            全文多段模式
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-primary focus:ring-primary/30"
              checked={useFeedRank}
              onChange={e => onUseFeedRankChange(e.target.checked)}
            />
            生成后 Feed 智能排序
          </label>
        </div>

        {lastRankingInfo && (
          <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">{lastRankingInfo}</p>
        )}

        <div className="mt-4">
          <ResearchButton disabled={generating} onClick={onGenerateIdeas} size="md">
            {generating ? '生成中…' : '生成科研 Idea'}
          </ResearchButton>
        </div>
        {generateError && <p className="mt-3 text-sm text-danger">{generateError}</p>}
      </SectionCard>

      <SectionCard title="创意 Feed" subtitle={ideas.length ? `共 ${ideas.length} 条` : '生成后将在此展示'}>
        {ideas.length === 0 ? (
          <p className="text-sm text-muted">尚无 Idea，请填写文本后点击生成。</p>
        ) : (
          <div className="space-y-4">
            {ideas.map(idea => (
              <ResearchIdeaCard
                key={idea.id}
                idea={idea}
                selected={idea.id === selectedIdeaId}
                onSelect={() => onSelectIdea(idea.id)}
                onConvert={() => onConvertIdea(idea.id)}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
