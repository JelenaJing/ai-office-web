import { Outlet } from 'react-router-dom'
import '../theme/donut-typography.css'
import '../theme/os-theme.css'
import '@xyflow/react/dist/style.css'
import { ToastBanner } from '../components/ToastBanner'

export default function DonutOsLayout() {
  return (
    <div className="research-os-root flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
      <ToastBanner />
    </div>
  )
}
