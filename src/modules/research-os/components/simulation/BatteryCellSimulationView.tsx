import { useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore'
import './battery-simulation.css'

const SCENARIO_LABELS: Record<string, string> = {
  standard: '标准 1C 充放电',
  fast: '快充 4C',
  low: '低温 -20°C',
  high: '高温安全',
  cycle: '循环老化 500 次',
}

/** 自上而下：顶部正极侧 → 底部负极侧，与组装页叠层方向一致 */
export function BatteryCellSimulationView({
  scenarioKey,
  running,
}: {
  scenarioKey: string
  running: boolean
}) {
  const layers = useProjectStore(s => s.layers)
  const selectedLayerId = useProjectStore(s => s.selectedLayerId)
  const stackProps = useProjectStore(s => s.stackProps)

  const displayLayers = useMemo(() => [...layers].reverse(), [layers])
  const maxUm = Math.max(...layers.map(l => l.thicknessUm), 1)
  const showThermal = running && (scenarioKey === 'fast' || scenarioKey === 'high')

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6">
      <p className="mb-1 text-xl font-bold text-slate-900">{SCENARIO_LABELS[scenarioKey] ?? '电芯仿真'}</p>
      <p className="mb-6 text-base text-slate-600">
        锂离子沿叠层方向迁移（自上而下）· 总厚 {stackProps.totalThicknessUm} μm
      </p>

      <div className="relative w-full max-w-md">
        {showThermal ? <div className="battery-sim-charge-glow" aria-hidden /> : null}
        <div
          className={`relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-lg ${showThermal ? 'battery-sim-thermal' : ''}`}
        >
          <p className="mb-3 text-center text-sm font-bold text-slate-500">顶部 · 正极侧</p>
          <div className="flex flex-col gap-1.5">
            {displayLayers.map(layer => {
              const selected = selectedLayerId === layer.id
              const h = Math.max(18, (layer.thicknessUm / maxUm) * 56)
              return (
                <div
                  key={layer.id}
                  className={`flex items-stretch gap-2 transition-all duration-300 ${running ? 'battery-sim-layer--active' : ''}`}
                  style={{ minHeight: h }}
                >
                  <span className="flex w-[7.5rem] shrink-0 items-center text-[11px] font-semibold leading-tight text-slate-700">
                    {layer.label}
                  </span>
                  <div
                    className="min-w-0 flex-1 rounded-md border-2 transition-all duration-300"
                    style={{
                      height: h,
                      background: layer.color,
                      borderColor: selected ? '#0b66ff' : '#e2e8f0',
                      boxShadow: selected ? '0 0 16px rgba(11,102,255,.35)' : undefined,
                    }}
                  />
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-center text-sm font-bold text-slate-500">底部 · 负极侧</p>

          {running ? (
            <div className="pointer-events-none absolute inset-x-28 inset-y-10 overflow-hidden">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="battery-sim-ion"
                  style={{
                    top: `${8 + ((i * 11) % 78)}%`,
                    animationDelay: `${i * 0.09}s`,
                    animationDuration: `${1.2 + (i % 5) * 0.12}s`,
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-lg border border-slate-200 bg-white py-2 shadow-sm">
            <p className="text-slate-500">充电</p>
            <p className={`font-bold ${running ? 'text-emerald-700' : 'text-slate-400'}`}>
              {running ? '进行中' : '已暂停'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white py-2 shadow-sm">
            <p className="text-slate-500">离子流</p>
            <p className={`font-bold ${running ? 'text-blue-700' : 'text-slate-400'}`}>
              {running ? 'Li⁺ ↓' : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white py-2 shadow-sm">
            <p className="text-slate-500">热区</p>
            <p className={`font-bold ${scenarioKey === 'fast' && running ? 'text-amber-700' : 'text-slate-600'}`}>
              {scenarioKey === 'fast' && running ? '局部升温' : '稳定'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
