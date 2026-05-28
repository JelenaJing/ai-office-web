import { Outlet, useLocation } from 'react-router-dom'
import { ResearchBackHomeLink } from '../components/ResearchBackHomeLink'
import clsx from 'clsx'
import { PlatformOverlays } from '../../materials-research/components/common/PlatformOverlays'
import { GlobalAssistant } from '../../materials-research/components/assistant/GlobalAssistant'
import { useAssistantStore } from '../../materials-research/store/assistantStore'
import { resolveFeatureMeta } from './featureRouteMeta'

/** 功能全屏页：顶栏返回 + 内容区（不用 useMatches） */
export default function FeaturePageLayout() {
  const assistantOpen = useAssistantStore(s => s.open)
  const { pathname } = useLocation()
  const meta = resolveFeatureMeta(pathname)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white px-4 shadow-sm">
        <ResearchBackHomeLink />
        {meta?.title ? (
          <div className="min-w-0 border-l border-slate-200 pl-3">
            <h1 className="truncate text-[14px] font-semibold text-slate-800">{meta.title}</h1>
            {meta.subtitle ? (
              <p className="truncate text-[11px] text-slate-500">{meta.subtitle}</p>
            ) : null}
          </div>
        ) : null}
      </header>

      <main
        className={clsx(
          'min-h-0 flex-1 overflow-y-auto px-4 py-4 transition-[margin-right] md:px-6',
          assistantOpen && 'mr-[min(33vw,420px)]',
        )}
      >
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      <PlatformOverlays />
      <GlobalAssistant />
    </div>
  )
}

export function featureRouteHandle(title: string, subtitle?: string) {
  return { title, subtitle }
}
