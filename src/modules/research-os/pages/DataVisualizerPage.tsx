import { OsChrome } from '../components/OsChrome'
import { useProjectStore } from '../store/projectStore'

export default function DataVisualizerPage() {
  const project = useProjectStore(s => s.project)
  const stackProps = useProjectStore(s => s.stackProps)
  const scores = [
    ['能量', 82],
    ['倍率', 67],
    ['循环', 74],
    ['安全', 59],
    ['成本', 68],
    ['制造', 72],
  ] as const

  return (
    <OsChrome>
      <div className="os-scroll flex-1 bg-[#eef2f7] p-6">
        <div className="mx-auto max-w-7xl text-slate-900">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-blue-700">数据分析</p>
              <h1 className="mt-2 text-4xl font-bold">{project.name}</h1>
              <p className="mt-2 text-xl text-slate-600">
                总厚 {stackProps.totalThicknessUm} μm · 等效电导 {stackProps.effectiveConductivityMsCm} mS/cm
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-lg font-bold text-emerald-800">
              仿真已完成
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {scores.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#d8dee9] bg-white p-4 shadow-sm">
                <p className="text-base text-slate-500">{label}</p>
                <p className="mt-2 text-4xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
            <section className="rounded-2xl border border-[#d8dee9] bg-white p-6 shadow-sm">
              <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-full border-[18px] border-slate-200 bg-[#f8fafc]">
                <div className="absolute inset-[-18px] rounded-full border-[18px] border-blue-500 border-r-transparent border-b-transparent" />
                <div className="text-center">
                  <p className="text-6xl font-bold text-slate-900">71</p>
                  <p className="text-lg text-blue-700">综合评分</p>
                </div>
              </div>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                当前设计达到能量密度目标，但 4C 快充下锂沉积风险升高，建议增加界面涂层。
              </p>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              {['容量保持率曲线', '电压-容量曲线', '温度-时间曲线', '材料风险雷达'].map((title, idx) => (
                <div key={title} className="rounded-2xl border border-[#d8dee9] bg-white p-5 shadow-sm">
                  <p className="text-xl font-bold text-slate-900">{title}</p>
                  <svg viewBox="0 0 360 160" className="mt-4 h-40 w-full">
                    <polyline
                      points={
                        idx === 0
                          ? '10,30 80,42 150,58 220,84 300,118 350,130'
                          : idx === 1
                            ? '10,130 80,105 150,78 230,52 350,24'
                            : '10,118 80,105 150,94 220,70 300,45 350,36'
                      }
                      fill="none"
                      stroke={idx === 2 ? '#f97316' : '#0b66ff'}
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <line x1="10" y1="140" x2="350" y2="140" stroke="#cbd5e1" />
                    <line x1="10" y1="12" x2="10" y2="140" stroke="#cbd5e1" />
                  </svg>
                </div>
              ))}
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
            <section className="rounded-2xl border border-[#d8dee9] bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">风险表</h2>
              <div className="mt-4 space-y-3 text-lg">
                {[
                  ['锂沉积', '高', '降低负极面载量或加入界面涂层'],
                  ['界面阻抗', '中', '优化 LLZO / 聚合物界面'],
                  ['温升', '中', '增加冷却板导热面积'],
                ].map(([risk, level, suggestion]) => (
                  <div key={risk} className="grid grid-cols-[1fr_72px_1.5fr] gap-3 rounded-xl bg-slate-50 p-3">
                    <span className="text-slate-800">{risk}</span>
                    <span className={level === '高' ? 'font-bold text-red-600' : 'font-bold text-amber-600'}>{level}</span>
                    <span className="text-slate-600">{suggestion}</span>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <h2 className="text-2xl font-bold text-blue-900">AI 解释</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-700">
                当前方案采用高镍正极与固态电解质，能量密度较高；但快充仿真显示界面极化和锂沉积风险上升。建议下一步将负极面载量降低
                8%，增加界面涂层，并重新运行 4C 快充仿真。
              </p>
            </aside>
          </div>
        </div>
      </div>
    </OsChrome>
  )
}
