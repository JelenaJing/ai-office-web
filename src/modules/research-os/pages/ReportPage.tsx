import { useMemo } from 'react'
import { OsChrome } from '../components/OsChrome'
import { useProjectStore } from '../store/projectStore'
import { getMaterialSpec } from '../utils/compositeProperties'

export default function ReportPage() {
  const project = useProjectStore(s => s.project)
  const layers = useProjectStore(s => s.layers)
  const stackProps = useProjectStore(s => s.stackProps)

  const layerRows = useMemo(
    () =>
      layers.map((layer, index) => {
        const spec = getMaterialSpec(layer.materialId)
        return {
          index: index + 1,
          label: layer.label,
          thickness: layer.thicknessUm,
          conductivity: spec?.ionicConductivity ?? '—',
          modulus: spec?.elasticModulusGpa ?? '—',
          adhesion: spec?.interfacialAdhesion ?? '—',
        }
      }),
    [layers],
  )

  const cathodeLayer = layers.find(l => l.materialId.includes('cathode'))
  const electrolyteLayer = layers.find(l => l.materialId.includes('electrolyte'))
  const anodeLayer = layers.find(l => l.materialId.includes('anode'))

  return (
    <OsChrome>
      <div className="os-scroll flex-1 bg-[#eef2f7] p-6">
        <div className="mx-auto max-w-4xl">
          <main className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-blue-700">电池设计报告</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-950">{project.name}</h1>
            <p className="mt-4 text-xl leading-relaxed text-slate-600">
              本报告基于 DonutOS 材料科研工作台中的叠层装配、蓝图连线与仿真结果自动生成，面向高能量密度软包电芯方案筛选与工艺评审。
              当前方案采用 NCM811 正极 / 固态或凝胶电解质 / 硅碳或石墨负极的层状复合结构，兼顾快充、循环与安全边界。
            </p>

            <section className="mt-10 space-y-4 text-lg leading-relaxed text-slate-700">
              <h2 className="text-2xl font-bold text-slate-950">一、项目概要</h2>
              <p>
                项目编号 {project.id}，当前阶段「{project.stage}」。样品批次 {project.sampleCount} 组，关联实验数据{' '}
                {project.dataRows} 行。电极有效面积 {project.electrodeAreaCm2} cm²，参考膜厚 {project.filmThicknessUm}{' '}
                μm，聚合物参考质量 {project.polymerMassG} g。报告生成时叠层共 {layers.length} 层，自下而上完成三维装配与等效物性推算。
              </p>
              <p>
                设计意图：在 4C 快充工况下验证锂沉积风险与温升边界，同时满足能量密度 ≥ 320 Wh/kg、500 次循环容量保持率 ≥ 80%
                的中试筛选指标。本版报告用于内部评审与 AI Office 下游文档输出，不作为最终认证结论。
              </p>
            </section>

            <section className="mt-10 space-y-4 text-lg leading-relaxed text-slate-700">
              <h2 className="text-2xl font-bold text-slate-950">二、设计目标与约束</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>标称能量密度目标：≥ 320 Wh/kg（软包，25°C，0.2C 放电至 2.8 V）</li>
                <li>快充能力：恒流 4C 充电至 80% SOC，极耳温升 &lt; 12°C（仿真初值）</li>
                <li>循环寿命：800 次（1C/1C），容量保持率 ≥ 80%</li>
                <li>热安全：热失控触发温度目标 &gt; 150°C；针刺与过充场景需二次验证</li>
                <li>制造约束：辊压面密度波动 ±3%，电解液注液量 CV &lt; 2%，叠片对齐度 ±0.15 mm</li>
                <li>成本约束：正极活性材料占 BOM 成本 &lt; 42%（相对石墨体系基准 +8% 可接受）</li>
              </ul>
              <p>
                正极主选 {cathodeLayer?.label ?? 'NCM811 正极'}，电解质路径 {electrolyteLayer?.label ?? 'LLZO 固态电解质'}，负极路径{' '}
                {anodeLayer?.label ?? '硅碳负极'}。N/P 比初算 1.08（按面容量与库仑效率估算），后续需结合仿真极化曲线微调。
              </p>
            </section>

            <section className="mt-10 space-y-4 text-lg leading-relaxed text-slate-700">
              <h2 className="text-2xl font-bold text-slate-950">三、电芯叠层配置详表</h2>
              <p>
                叠层总厚度 {stackProps.totalThicknessUm} μm，等效离子电导率 {stackProps.effectiveConductivityMsCm} mS/cm，等效弹性模量{' '}
                {stackProps.equivalentModulusGpa} GPa，平均界面粘接指数 {stackProps.meanAdhesion}，估算能量密度{' '}
                {stackProps.estimatedEnergyDensityWhKg} Wh/kg（基于厚度与电导的启发式模型，需与全电池仿真交叉校验）。
              </p>
              {layerRows.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[520px] border-collapse text-base">
                    <thead>
                      <tr className="bg-slate-50 text-left text-slate-800">
                        <th className="border-b border-slate-200 px-4 py-3 font-bold">层序</th>
                        <th className="border-b border-slate-200 px-4 py-3 font-bold">材料</th>
                        <th className="border-b border-slate-200 px-4 py-3 font-bold">厚度 (μm)</th>
                        <th className="border-b border-slate-200 px-4 py-3 font-bold">电导 (mS/cm)</th>
                        <th className="border-b border-slate-200 px-4 py-3 font-bold">模量 (GPa)</th>
                        <th className="border-b border-slate-200 px-4 py-3 font-bold">粘接</th>
                      </tr>
                    </thead>
                    <tbody>
                      {layerRows.map(row => (
                        <tr key={row.index} className="text-slate-700">
                          <td className="border-b border-slate-100 px-4 py-2.5">L{row.index}</td>
                          <td className="border-b border-slate-100 px-4 py-2.5 font-semibold text-slate-900">{row.label}</td>
                          <td className="border-b border-slate-100 px-4 py-2.5">{row.thickness}</td>
                          <td className="border-b border-slate-100 px-4 py-2.5">{row.conductivity}</td>
                          <td className="border-b border-slate-100 px-4 py-2.5">{row.modulus}</td>
                          <td className="border-b border-slate-100 px-4 py-2.5">{row.adhesion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-amber-900">尚未配置叠层，请先在「组装」页添加材料。</p>
              )}
              <p>
                集流体与壳体主要承担电流收集与封装；活性层与隔膜决定离子传输路径。若采用固态电解质，建议关注固-固界面阻抗与辊压后孔隙率，并在 Connections
                工作流中串联「配方推荐 → 性能预测 → 仿真计算」节点以闭环迭代。
              </p>
            </section>

            <section className="mt-10 space-y-4 text-lg leading-relaxed text-slate-700">
              <h2 className="text-2xl font-bold text-slate-950">四、物性模型与等效推算</h2>
              <p>
                离子电导率按厚度加权平均估算等效值；弹性模量同样采用厚度加权。界面粘接取各层算术平均，用于启发式能量密度修正。该简化模型适用于方案对比排序，不替代
                Newman 型 P2D 电化学模型。建议在仿真页启用 4C 快充与 1C 循环两个标准场景，对比极化、锂沉积指数与温场热点。
              </p>
              <p>
                当前叠层在厚度方向呈现「集流体—正极—隔膜—电解质—负极—集流体」典型软包序列。若负极采用硅碳，需额外评估首周不可逆容量与体积膨胀对界面应力的影响，建议负极面载量较石墨体系下调
                8%–12%。
              </p>
            </section>

            <section className="mt-10 space-y-4 text-lg leading-relaxed text-slate-700">
              <h2 className="text-2xl font-bold text-slate-950">五、仿真与电化学性能结果</h2>
              <p>以下为工作台默认仿真工况的汇总（演示数据，接入真实求解器后自动刷新）：</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>综合评分：71 / 100（能量 28、安全 22、成本 11、可制造 10）</li>
                <li>能量密度：328 Wh/kg（与目标对比 +2.5%）</li>
                <li>4C 恒流充电：80% SOC 用时 14.8 min，极耳最高温 45°C</li>
                <li>1C 循环：500 次容量保持率 82%，1000 次 extrapolated 74%</li>
                <li>直流内阻（25°C，50% SOC）：12.4 mΩ</li>
                <li>锂沉积风险指数（4C）：0.42（中等，建议优化负极与电解液配方）</li>
              </ul>
            </section>

            <section className="mt-10 space-y-4 text-lg leading-relaxed text-slate-700">
              <h2 className="text-2xl font-bold text-slate-950">六、热安全与可靠性</h2>
              <p>
                过充至 4.45 V 仿真显示表面最高温 68°C，未触发隔膜收缩拐点；针刺场景需补充实验。建议增加气凝胶隔热层或降低面容量以改善热扩散。软包封边区域为应力集中带，叠片对齐度应纳入
                SPC 监控。
              </p>
            </section>

            <section className="mt-10 space-y-4 text-lg leading-relaxed text-slate-700">
              <h2 className="text-2xl font-bold text-slate-950">七、AI 优化建议</h2>
              <ol className="list-decimal space-y-2 pl-6">
                <li>在正极表面增加纳米涂层（Al₂O₃ 或 LiNbO₃），降低固-固界面阻抗，预期 4C 极化下降 6%–9%。</li>
                <li>负极面载量下调 8%，重新平衡 N/P 至 1.12，缓解快充锂沉积。</li>
                <li>固态电解质层厚由 {electrolyteLayer?.thicknessUm ?? 36} μm 试算减薄 4 μm，观察电导与机械强度 trade-off。</li>
                <li>在 Connections 中增加「老化模型」节点，串联循环数据回灌评分模块。</li>
                <li>输出 Word/PPT 前建议运行一轮 4C + 常温循环联合仿真以锁定报告数字。</li>
              </ol>
            </section>

            <section className="mt-10 space-y-4 text-lg leading-relaxed text-slate-700">
              <h2 className="text-2xl font-bold text-slate-950">八、下一步实验计划</h2>
              <p>
                第 1 周：完成 3 组软包试制（面容量 3.2 / 3.6 / 4.0 mAh/cm²）；第 2 周：4C 快充 + 搁置 EIS；第 3 周：1C/1C 循环至 200 次并取样做
                SEM 界面分析；第 4 周：根据仿真与实验差异更新本报告并提交中试评审。
              </p>
            </section>

            <p className="mt-10 border-t border-slate-100 pt-6 text-base text-slate-500">
              报告版本 v1.0 · 自动生成 · 数据截止至本地项目状态保存时刻
            </p>
          </main>
        </div>
      </div>
    </OsChrome>
  )
}
