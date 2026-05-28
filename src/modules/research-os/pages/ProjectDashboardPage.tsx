import { Link, useParams } from 'react-router-dom'
import { OsChrome } from '../components/OsChrome'
import { ProjectSidebar } from '../components/ProjectSidebar'
import { LEX } from '../config/materialsLexicon'
import { useProjectStore } from '../store/projectStore'

export default function ProjectDashboardPage() {
  const { projectId = 'default' } = useParams()
  const project = useProjectStore(s => s.project)
  const layers = useProjectStore(s => s.layers)
  const stackProps = useProjectStore(s => s.stackProps)
  const connections = useProjectStore(s => s.connections)

  return (
    <OsChrome>
      <div className="os-body-row">
        <ProjectSidebar />
        <main className="os-scroll flex-1 bg-white p-8">
          <h1 className="text-3xl font-bold text-slate-900">{LEX.overview}</h1>
          <p className="mt-4 max-w-3xl text-xl text-slate-700">
            {project.name} · {layers.length} 层 · 总厚 {stackProps.totalThicknessUm} μm
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['总厚度 μm', stackProps.totalThicknessUm],
              ['电导 mS/cm', stackProps.effectiveConductivityMsCm],
              ['模量 GPa', stackProps.equivalentModulusGpa],
              ['Wh/kg', stackProps.estimatedEnergyDensityWhKg],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <dt className="text-lg text-slate-600">{k}</dt>
                <dd className="text-2xl font-bold text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
          <section className="mt-10">
            <h2 className="text-2xl font-bold">叠层</h2>
            <ol className="mt-4 space-y-2 text-xl">
              {layers.map((l, i) => (
                <li key={l.id}>
                  L{i + 1} {l.label} · {l.thicknessUm} μm
                </li>
              ))}
            </ol>
          </section>
          <section className="mt-8">
            <h2 className="text-2xl font-bold">数据连线（{connections.length}）</h2>
            <ul className="mt-4 space-y-2 text-xl">
              {connections.map(c => (
                <li key={c.id}>{c.title}</li>
              ))}
            </ul>
          </section>
          <Link to={`/research/os/project/${projectId}/connections`} className="os-btn os-btn-primary mt-8 inline-flex">
            打开{LEX.connections}
          </Link>
        </main>
      </div>
    </OsChrome>
  )
}
