import clsx from 'clsx'
import { Outlet, useLocation } from 'react-router-dom'
import { ResearchBackHomeLink } from '../components/ResearchBackHomeLink'
import { PlatformOverlays } from '../../materials-research/components/common/PlatformOverlays'

/** 首页无顶栏；子页仅保留返回 */
export default function ResearchModuleShell() {
  const location = useLocation()
  const isHome = location.pathname === '/research' || location.pathname === '/research/'
  const isFullWidth =
    /^\/research\/(eln|models|recommend)(\/|$)/.test(location.pathname)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f6f9]">
      {!isHome && (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm md:px-6">
          <ResearchBackHomeLink />
        </header>
      )}

      <main
        className={clsx(
          'flex min-h-0 flex-1 flex-col',
          isHome ? 'overflow-hidden p-0' : 'overflow-y-auto px-4 py-4 md:px-6',
        )}
      >
        <div
          className={clsx(
            'flex w-full min-h-0 flex-1 flex-col',
            isHome ? 'h-full min-h-0' : isFullWidth ? 'min-h-[480px]' : 'mx-auto max-w-6xl',
          )}
        >
          <Outlet />
        </div>
      </main>

      <PlatformOverlays />
    </div>
  )
}
