import { useState } from 'react'
import { SectionCard } from '../../materials-research/components/common/SectionCard'
import { ResearchButton } from './ResearchUi'
import { generatePlot, recommendPlot } from '../api/researchApi'
import type { PlotGenerateResponse, PlotRecommendationResponse } from '../api/plotTypes'

interface TemplatePlotPanelProps {
  projectId?: string
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function TemplatePlotPanel({ projectId }: TemplatePlotPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [templateId, setTemplateId] = useState('')
  const [useLlm, setUseLlm] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendation, setRecommendation] = useState<PlotRecommendationResponse | null>(null)
  const [result, setResult] = useState<PlotGenerateResponse | null>(null)

  const runRecommend = async () => {
    if (!file) {
      setError('请先选择数据文件')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const raw = await file.text()
      setRecommendation(await recommendPlot({ rawText: raw, useLlm, templateId: templateId || undefined }))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const runGenerate = async () => {
    if (!file) {
      setError('请先选择数据文件')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const out = await generatePlot({
        file,
        projectId: projectId || undefined,
        templateId: templateId || undefined,
        useLlm,
      })
      setResult(out)
      if (out.recommendation) setRecommendation(out.recommendation)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const imageSrc = result?.image
    ? result.image.startsWith('data:')
      ? result.image
      : `data:image/png;base64,${result.image}`
    : undefined

  return (
    <SectionCard
      title="模板画图"
      subtitle="上传 CSV / Excel / JSON，由 matplotlib 生成科研图表（与 AI 生图独立）。"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          数据文件
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json,.tsv"
            className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          template_id（可选）
          <input
            className={inputClass}
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            placeholder="pl_line"
          />
        </label>
      </div>

      <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          className="rounded border-slate-300 text-primary"
          checked={useLlm}
          onChange={e => setUseLlm(e.target.checked)}
        />
        LLM 数据类型识别
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <ResearchButton variant="secondary" disabled={loading} onClick={() => void runRecommend()}>
          仅推荐
        </ResearchButton>
        <ResearchButton disabled={loading} onClick={() => void runGenerate()}>
          {loading ? '生成中…' : '生成图表'}
        </ResearchButton>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      {recommendation && (
        <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-sm text-slate-700">
          推荐：<strong className="text-primary">{recommendation.recommended_chart}</strong>
          {' '}（{Math.round(recommendation.confidence * 100)}%）— {recommendation.reasoning}
        </p>
      )}
      {imageSrc && (
        <div className="research-plot-preview-wrap mt-6">
          <img className="research-plot-preview" src={imageSrc} alt="生成的科研图表" />
        </div>
      )}
    </SectionCard>
  )
}
