import { useEffect, useState } from 'react'
import { OsChrome } from '../components/OsChrome'
import { BatteryCellSimulationView } from '../components/simulation/BatteryCellSimulationView'
import { useProjectStore } from '../store/projectStore'

const SCENARIOS = [
  { key: 'standard', label: '标准 1C 充放电' },
  { key: 'fast', label: '快充 4C' },
  { key: 'low', label: '低温 -20°C' },
  { key: 'high', label: '高温安全' },
  { key: 'cycle', label: '循环老化 500 次' },
] as const

export default function SimulatorPage() {
  const setMode = useProjectStore(s => s.setMode)
  const stackProps = useProjectStore(s => s.stackProps)
  const [elapsed, setElapsed] = useState(28460)
  const [running, setRunning] = useState(true)
  const [scenarioKey, setScenarioKey] = useState<(typeof SCENARIOS)[number]['key']>('fast')

  useEffect(() => {
    setMode('simulator')
  }, [setMode])

  useEffect(() => {
    if (!running) return undefined
    const t = setInterval(() => setElapsed(e => e + 137), 137)
    return () => clearInterval(t)
  }, [running])

  const timeStr = `${Math.floor(elapsed / 60000)}:${String(Math.floor((elapsed / 1000) % 60)).padStart(2, '0')}.${String(elapsed % 1000).padStart(3, '0')}`
  const scenarioLabel = SCENARIOS.find(s => s.key === scenarioKey)?.label ?? ''

  return (
    <OsChrome>
      <div className="os-body-row min-h-0 bg-[#eef2f7]">
        <aside className="os-panel-compact w-[220px] shrink-0 border-r border-[#d8dee9] bg-white p-4">
          <p className="text-lg font-bold text-slate-800">实时指标</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ['荷电状态', '78 %'],
              ['电压', '4.12 V'],
              ['电流', '4.0 C'],
              ['温度', '41 °C'],
              ['内阻', '47 mΩ'],
              ['锂沉积', '中'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-[#d8dee9] bg-[#f8fafc] px-2 py-2">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-lg font-bold leading-tight text-slate-900">{v}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#f1f5f9]">
          <BatteryCellSimulationView scenarioKey={scenarioKey} running={running} />
        </div>

        <aside className="os-panel-compact w-[280px] shrink-0 border-l border-[#d8dee9] bg-white p-4">
          <p className="text-right text-4xl font-bold tabular-nums text-slate-900">{timeStr}</p>
          <div className="mt-4 rounded-xl border border-[#d8dee9] bg-[#f8fafc] p-3">
            <p className="text-base font-bold text-slate-800">仿真场景</p>
            <select
              value={scenarioKey}
              onChange={e => setScenarioKey(e.target.value as typeof scenarioKey)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
            >
              {SCENARIOS.map(s => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button type="button" className="os-btn os-btn-primary !min-h-[40px] !px-2 text-sm" onClick={() => setRunning(true)}>
                运行
              </button>
              <button type="button" className="os-btn os-btn-ghost !min-h-[40px] !px-2 text-sm" onClick={() => setRunning(false)}>
                暂停
              </button>
              <button type="button" className="os-btn os-btn-ghost !min-h-[40px] !px-2 text-sm" onClick={() => setElapsed(0)}>
                重置
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-[8px] border-slate-200 bg-white">
              <div
                className="absolute inset-[-8px] rounded-full border-[8px] border-blue-500 border-r-transparent"
                style={{ transform: `rotate(${running ? (elapsed / 80) % 360 : 0}deg)` }}
              />
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">71</p>
                <p className="text-xs text-blue-600">综合评分</p>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-sm text-slate-500">能量 82 · 安全 59 · 循环 74</p>
        </aside>
      </div>
      <div className="shrink-0 border-t border-[#d8dee9] bg-white px-5 py-2 text-base text-slate-600">
        时间轴：0 秒 — 100 秒 — 500 次循环 · 当前：{scenarioLabel} · 叠层 {stackProps.totalThicknessUm} μm
      </div>
    </OsChrome>
  )
}
