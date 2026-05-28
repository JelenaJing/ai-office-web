import { Link } from 'react-router-dom'
import { BarChart3, FileText, GitBranch, Layers, Play } from 'lucide-react'

const cards = [
  { title: '蓝图', desc: '无代码定义电池材料研发逻辑', icon: GitBranch, to: '/research/os/project/default/connections' },
  { title: '组装', desc: '三维拼装电池层级与封装结构', icon: Layers, to: '/research/os/builder' },
  { title: '仿真', desc: '充放电、热扩散与离子迁移仿真', icon: Play, to: '/research/os/simulator' },
  { title: '分析', desc: '综合评分、风险与 AI 解释', icon: BarChart3, to: '/research/os/project/default/visualizer' },
  { title: '输出', desc: '生成报告、演示文稿、实验计划与知识库', icon: FileText, to: '/research/os/project/default/report' },
]

export default function BatteryLabHomePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[#eef2f7] px-8 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center">
        <h1 className="text-6xl font-semibold tracking-tight text-slate-900">电池材料设计工作台</h1>
        <p className="mt-5 max-w-3xl text-2xl leading-relaxed text-slate-600">
          设计材料、仿真电芯、分析数据，并在同一工作流中生成科研输出。
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/research/os/builder" className="os-btn os-btn-primary">
            新建电池课题
          </Link>
          <Link to="/research/os/project/default/connections" className="os-btn os-btn-ghost">
            打开演示课题
          </Link>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <Link
                key={card.title}
                to={card.to}
                className="rounded-2xl border border-[#d8dee9] bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
              >
                <Icon className="h-8 w-8 text-blue-600" />
                <h2 className="mt-5 text-2xl font-bold">{card.title}</h2>
                <p className="mt-2 text-lg leading-relaxed text-slate-600">{card.desc}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
