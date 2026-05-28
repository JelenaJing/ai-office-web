/** 实验过程四通道遥测 */
export function MaterialsRunHud() {
  const channels = [
    { pos: '反应釜 A', value: '85.2', unit: '°C' },
    { pos: '电解液槽', value: '6.82', unit: 'pH' },
    { pos: '电化学工位', value: '1.24', unit: 'A' },
    { pos: '力学传感器', value: '42.1', unit: 'MPa' },
  ]

  return (
    <div className="rounded-xl border border-white/10 bg-black/75 p-4">
      <div className="mb-3 text-center">
        <p className="text-4xl font-bold text-white">72</p>
        <p className="text-lg text-emerald-300">% 反应进度</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {channels.map(m => (
          <div key={m.pos} className="rounded-lg border border-white/10 bg-slate-900 p-2">
            <p className="text-sm font-bold text-emerald-300">{m.pos}</p>
            <p className="text-xl font-bold text-white">
              {m.value} {m.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
