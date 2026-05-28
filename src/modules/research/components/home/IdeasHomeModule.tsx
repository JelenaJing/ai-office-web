import { useEffect, useState } from 'react'
import { generateIdeas } from '../../api/researchApi'
import { researchIdeaCards } from '../../mockResearchData'
import type { ResearchIdeaCard } from '../../types'
import { ResearchButton } from '../ResearchUi'
import { ClickableModuleCard } from './ClickableModuleCard'

export default function IdeasHomeModule() {
  const [text, setText] = useState('钙钛矿界面钝化策略与缺陷调控')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<ResearchIdeaCard[]>(researchIdeaCards.slice(0, 2))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIdeas(researchIdeaCards.slice(0, 2))
  }, [])

  const run = async () => {
    if (!text.trim()) {
      setError('请输入研究摘要或关键词')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { ideas: generated } = await generateIdeas({
        selectedText: text.trim(),
        field: '材料科学',
      })
      setIdeas(generated.slice(0, 3))
    } catch (e) {
      setIdeas(researchIdeaCards.slice(0, 3))
      setError((e instanceof Error ? e.message : '生成失败') + '（已展示示例）')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClickableModuleCard
      to="/research/tools/ideas"
      title="创意 Feed"
      hint="读完文献与数据库后，从摘要生成可验证研究假说"
      enterLabel="完整版"
    >
      <div className="space-y-3">
        <ul className="space-y-2">
          {ideas.map(idea => (
            <li key={idea.id} className="rounded-xl border border-slate-200 bg-slate-50/80 px-5 py-4">
              <p className="line-clamp-2 text-[16px] font-semibold leading-snug text-slate-900">{idea.title}</p>
              <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-slate-600">
                {idea.coreObservation}
              </p>
              <p className="mt-1.5 text-[12px] text-slate-400">
                新颖度 {idea.noveltyScore} · 可行性 {idea.feasibilityScore}
              </p>
            </li>
          ))}
        </ul>
        <textarea
          rows={2}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="粘贴摘要、选题或关键词…"
        />
        <div className="research-btn-row">
          <ResearchButton size="md" variant="primary" disabled={loading} onClick={() => void run()}>
            {loading ? '生成中…' : '重新生成创意'}
          </ResearchButton>
        </div>
        {error ? <p className="text-[13px] text-amber-800">{error}</p> : null}
      </div>
    </ClickableModuleCard>
  )
}
