import { useEffect, useState } from 'react'
import clsx from 'clsx'
import type { FormulationResult } from '../../../materials-research/services/mockApi'
import { runFormulation, localDataHint } from '../../data/researchDataAccess'
import { LOCAL_FORMULATION_SAMPLE } from '../../data/researchLocalData'
import { ResearchButton } from '../ResearchUi'
import { ClickableModuleCard, ModuleDataBanner } from './ClickableModuleCard'

const TARGETS = ['高 Tg', '高韧性', '可降解', '电极粘结', '高生物基']

export default function FormulationHomeModule() {
  const [selected, setSelected] = useState<string[]>(['高 Tg', '高韧性'])
  const [extra, setExtra] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FormulationResult | null>(LOCAL_FORMULATION_SAMPLE)
  const [hint, setHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void runFormulation({ targets: ['高 Tg', '高韧性'] }).then(({ data, source }) => {
      setResult(data)
      setHint(localDataHint(source))
    })
  }, [])

  const toggle = (t: string) => {
    setSelected(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]))
  }

  const run = async () => {
    if (selected.length === 0) {
      setError('请至少选择一个目标')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data, source } = await runFormulation({
        targets: selected,
        extraGoal: extra.trim() || undefined,
      })
      setResult(data)
      setHint(localDataHint(source))
    } catch (e) {
      setError(e instanceof Error ? e.message : '推荐失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClickableModuleCard
      to="/research/tools/formulation"
      title="配方推荐"
      hint="根据目标性能匹配单体组合与工艺窗口"
      enterLabel="详细计算"
    >
      <ModuleDataBanner message={hint} />
      <div className="space-y-3">
        {result ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-5 py-4">
            <p className="text-[17px] font-semibold text-slate-900">{result.summary}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{result.rationale}</p>
            <p className="mt-2 text-[14px] text-slate-500">
              推荐单体：{result.monomers?.join('、')} · 置信度 {Math.round(result.confidence * 100)}%
            </p>
            {result.risks?.[0] ? (
              <p className="mt-2 text-[13px] text-amber-800">注意：{result.risks[0]}</p>
            ) : null}
          </div>
        ) : null}
        <div className="research-btn-row">
          {TARGETS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={clsx(
                'research-tag',
                selected.includes(t) ? 'research-tag--on' : 'research-tag--off',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          placeholder="补充目标描述（可选）"
          value={extra}
          onChange={e => setExtra(e.target.value)}
        />
        <div className="research-btn-row pt-1">
          <ResearchButton size="md" variant="primary" disabled={loading} onClick={() => void run()}>
            {loading ? '计算中…' : '更新推荐方案'}
          </ResearchButton>
        </div>
        {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
      </div>
    </ClickableModuleCard>
  )
}
