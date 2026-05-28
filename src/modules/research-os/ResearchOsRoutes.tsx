import { Navigate } from 'react-router-dom'

export function ResearchEntryRedirect() {
  return <Navigate to="/research" replace />
}

/** @deprecated 路由已迁至 researchOsRouteTree；保留默认导出避免旧引用断裂 */
export { researchOsRouteTree as default } from './researchOsRouteTree'
