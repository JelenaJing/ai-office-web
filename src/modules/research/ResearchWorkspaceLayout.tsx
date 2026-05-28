import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import './materials-research.css'
import { useResearchSessionBridge } from './bridge/useResearchSessionBridge'
import { bindTenantId } from '../materials-research/services/api'
import { resolveTenantId } from '../materials-research/config/appMode'
import { useTenantStore } from '../materials-research/store/tenantStore'
import { useAppStore } from '../materials-research/store/appStore'
import { api } from '../materials-research/services/api'

function ResearchBootstrap() {
  const applySettings = useAppStore(s => s.applySettings)
  const tenantId = useTenantStore(s => s.tenantId)

  useEffect(() => {
    bindTenantId(() => resolveTenantId(useTenantStore.getState().tenantId))
  }, [])

  useEffect(() => {
    api.settings.get().then(applySettings).catch(() => undefined)
  }, [applySettings, tenantId])

  return null
}

/** 科研模块布局：会话桥接 + 子路由出口（路由定义见 researchAppRoutes.tsx） */
export default function ResearchWorkspaceLayout() {
  useResearchSessionBridge()

  return (
    <div className="research-materials-root flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <ResearchBootstrap />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
