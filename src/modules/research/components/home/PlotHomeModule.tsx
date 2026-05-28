import { useState } from 'react'
import { generatePlot } from '../../api/researchApi'
import { PLOT_TEMPLATE_HINTS } from '../../data/researchLocalData'
import { ResearchButton } from '../ResearchUi'
import { ClickableModuleCard } from './ClickableModuleCard'

export default function PlotHomeModule() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string | undefined>()

  const run = async () => {
    if (!file) {
      setError('请选择 CSV / Excel 数据文件')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const out = await generatePlot({ file, useLlm: true })
      const img = out.image
      setImageSrc(img?.startsWith('data:') ? img : img ? `data:image/png;base64,${img}` : undefined)
    } catch (e) {
      setError((e instanceof Error ? e.message : '生成失败') + ' · 请确认 Paper Remake 后端已启动')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClickableModuleCard
      to="/research/tools/plot"
      title="模板画图"
      hint="上传实验数据，自动推荐图表类型并生成科研图"
      enterLabel="完整版"
    >
      <div className="space-y-3">
        <ul className="grid gap-2 sm:grid-cols-3">
          {PLOT_TEMPLATE_HINTS.map(h => (
            <li
              key={h.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
            >
              <span className="text-[14px] font-medium text-slate-800">{h.label}</span>
              <p className="mt-0.5 text-[13px] text-slate-500">{h.example}</p>
            </li>
          ))}
        </ul>
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          className="block w-full text-[14px] file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-white"
          onChange={e => {
            setFile(e.target.files?.[0] ?? null)
            setImageSrc(undefined)
          }}
        />
        <div className="research-btn-row">
          <ResearchButton size="md" variant="primary" disabled={loading} onClick={() => void run()}>
            {loading ? '生成中…' : '快速出图'}
          </ResearchButton>
        </div>
        {error ? <p className="text-[13px] text-amber-800">{error}</p> : null}
        {imageSrc ? (
          <div className="research-plot-preview-wrap">
            <img src={imageSrc} alt="科研图" className="research-plot-preview" />
          </div>
        ) : (
          <p className="text-[13px] text-slate-500">支持 CSV / Excel；可用 qwen-flash 辅助识别数据类型</p>
        )}
      </div>
    </ClickableModuleCard>
  )
}
