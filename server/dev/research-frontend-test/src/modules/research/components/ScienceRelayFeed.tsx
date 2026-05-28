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
  onApplyFeedRank: () => void
  feedRanking: boolean
  feedRankApplied: boolean
  feedRankError: string | null
  lastRankingInfo: string | null
  selectedFieldName: string
  onUploadPdf: (file: File) => void
  pdfUploading: boolean
  pdfUploadMessage: string | null
}

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
  onApplyFeedRank,
  feedRanking,
  feedRankApplied,
  feedRankError,
  lastRankingInfo,
  selectedFieldName,
  onUploadPdf,
  pdfUploading,
  pdfUploadMessage,
}: ScienceRelayFeedProps) {
  return (
    <section className="research-panel">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">Science Relay / 科研 Idea Feed</h2>
          <p className="research-panel__subtitle">两步流程：先生成 Idea，再单独应用 X 推荐排序</p>
        </div>
      </div>

      <div className="research-flow-step research-flow-step--generate">
        <div className="research-flow-step__head">
          <span className="research-flow-step__badge">步骤 1</span>
          <h3 className="research-flow-step__title">生成科研 Idea</h3>
        </div>
        <div className="research-idea-generate">
          <div className="research-test-block">
            <label>
              上传论文 PDF
              <input
                type="file"
                accept=".pdf,application/pdf"
                disabled={pdfUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onUploadPdf(f)
                  e.target.value = ''
                }}
              />
            </label>
            {pdfUploadMessage && <p className="research-rank-info">{pdfUploadMessage}</p>}
          </div>
          <label>
            project_id
            <input
              value={projectId}
              onChange={(e) => onProjectIdChange(e.target.value)}
              placeholder="20260422_xxx"
            />
          </label>
          <label>
            来源文本
            <textarea
              rows={4}
              value={sourceText}
              onChange={(e) => onSourceTextChange(e.target.value)}
              placeholder="选中文本或研究摘要…"
            />
          </label>
          <label className="research-inline-check">
            <input
              type="checkbox"
              checked={fulltextMode}
              onChange={(e) => onFulltextModeChange(e.target.checked)}
            />
            全文多段模式
          </label>
          <button
            type="button"
            className="research-button research-button--primary"
            disabled={generating || feedRanking}
            onClick={onGenerateIdeas}
          >
            {generating ? '生成中…' : '生成科研 Idea'}
          </button>
          {generateError && <p className="research-error">{generateError}</p>}
        </div>
      </div>

      <div className="research-flow-step research-flow-step--x-rank">
        <div className="research-flow-step__head">
          <span className="research-flow-step__badge research-flow-step__badge--x">步骤 2</span>
          <h3 className="research-flow-step__title">X Feed 推荐排序</h3>
        </div>
        <p className="research-x-rank-desc">
          借鉴 X For You 候选流水线（<code>rule-based-v1</code>）：按领域匹配、新颖性、可行性、文献证据、
          订阅关键词与历史曝光降权计算 <strong>Feed 分</strong>，并重新排列列表。
          当前领域：<strong>{selectedFieldName}</strong>
        </p>
        <button
          type="button"
          className="research-button research-button--x"
          disabled={ideas.length === 0 || generating || feedRanking}
          onClick={onApplyFeedRank}
        >
          {feedRanking ? '排序中…' : '应用 X 推荐排序'}
        </button>
        {ideas.length === 0 && (
          <p className="research-plot-hint">请先在步骤 1 生成 Idea，再执行推荐排序。</p>
        )}
        {feedRankError && <p className="research-error">{feedRankError}</p>}
        {lastRankingInfo && <p className="research-rank-info research-rank-info--success">{lastRankingInfo}</p>}
      </div>

      <div className="research-list-header">
        <h3 className="research-list-header__title">Idea 列表</h3>
        {ideas.length > 0 && (
          <span
            className={`research-list-header__status${
              feedRankApplied ? ' research-list-header__status--ranked' : ''
            }`}
          >
            {feedRankApplied ? '已 X 排序' : '生成顺序（未排序）'}
          </span>
        )}
      </div>

      <div className="research-list">
        {ideas.length === 0 && <p className="research-panel__subtitle">尚无 Idea</p>}
        {ideas.map((idea, index) => (
          <ResearchIdeaCard
            key={idea.id}
            idea={idea}
            listIndex={feedRankApplied ? index + 1 : undefined}
            feedRankApplied={feedRankApplied}
            selected={idea.id === selectedIdeaId}
            onSelect={() => onSelectIdea(idea.id)}
            onConvert={() => onConvertIdea(idea.id)}
          />
        ))}
      </div>
    </section>
  )
}
