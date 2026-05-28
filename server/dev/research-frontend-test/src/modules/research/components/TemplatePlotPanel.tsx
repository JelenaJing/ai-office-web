import { useEffect, useMemo, useState } from 'react'
import { generatePlot } from '../../../api/researchApi'
import {
  fetchPlotDataTemplates,
  PLOT_DATA_TEMPLATES_FALLBACK,
  type PlotDataTemplate,
} from '../../../api/plotDataTemplates'
import type { PlotGenerateResponse } from '../../../api/plotTypes'

interface TemplatePlotPanelProps {
  projectId?: string
}

export default function TemplatePlotPanel({ projectId }: TemplatePlotPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [templates, setTemplates] = useState<PlotDataTemplate[]>(PLOT_DATA_TEMPLATES_FALLBACK)
  const [selectedDataType, setSelectedDataType] = useState('xrd_pattern')
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PlotGenerateResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setCatalogLoading(true)
      try {
        const list = await fetchPlotDataTemplates()
        if (!cancelled && list.length) {
          setTemplates(list)
          setSelectedDataType((prev) =>
            list.some((t) => t.data_type === prev) ? prev : list[0].data_type,
          )
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selected = useMemo(
    () => templates.find((t) => t.data_type === selectedDataType) ?? templates[0],
    [templates, selectedDataType],
  )

  const runGenerate = async () => {
    if (!file) {
      setError('请先选择数据文件')
      return
    }
    if (!selected?.template_id) {
      setError('请选择数据类型模板')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const out = await generatePlot({
        file,
        projectId: projectId || undefined,
        templateId: selected.template_id,
        dataType: selected.data_type,
        useLlm: false,
        autoRecommend: true,
      })
      setResult(out)
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
    <section className="research-panel research-panel--plot">
      <div className="research-panel__header">
        <div>
          <h2 className="research-panel__title">模板画图</h2>
          <p className="research-panel__subtitle">选择数据类型，按注册表模板出图（不经过 LLM 识别）</p>
        </div>
      </div>

      <div className="research-plot-controls">
        <label>
          数据文件
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json,.tsv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <fieldset className="research-plot-template-fieldset">
          <legend>数据类型模板</legend>
          {catalogLoading ? (
            <p className="research-plot-hint">加载模板列表…</p>
          ) : (
            <div className="research-plot-template-list" role="radiogroup" aria-label="数据类型模板">
              {templates.map((item) => (
                <label
                  key={item.data_type}
                  className={`research-plot-template-option${
                    item.data_type === selectedDataType ? ' is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="plot-data-template"
                    value={item.data_type}
                    checked={item.data_type === selectedDataType}
                    onChange={() => setSelectedDataType(item.data_type)}
                  />
                  <span className="research-plot-template-option__body">
                    <span className="research-plot-template-option__title">{item.label}</span>
                    <span className="research-plot-template-option__meta">
                      {item.chart_type_label} · {item.template_id}
                    </span>
                    <span className="research-plot-template-option__desc">{item.axis_summary}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        {selected && (
          <p className="research-plot-hint">
            将使用：<strong>{selected.label}</strong> → 模板 <code>{selected.template_id}</code>（
            {selected.chart_type_label}，坐标 {selected.axis_summary}）
          </p>
        )}

        <div className="research-plot-actions">
          <button
            type="button"
            className="research-button research-button--primary"
            disabled={loading || catalogLoading}
            onClick={() => void runGenerate()}
          >
            {loading ? '做图中…' : '数据做图'}
          </button>
        </div>

        {error && <p className="research-error">{error}</p>}
        {imageSrc && <img className="research-plot-image" src={imageSrc} alt="生成的科研图表" />}
      </div>
    </section>
  )
}
