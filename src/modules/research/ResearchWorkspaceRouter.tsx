import { Navigate, useRoutes } from 'react-router-dom'
import { researchRouteObjects } from './researchRouteObjects'

/** 在 App 内用 useRoutes 渲染科研子树（不依赖 WebApp 嵌套 Outlet） */
export default function ResearchWorkspaceRouter() {
  const element = useRoutes(researchRouteObjects)
  if (!element) {
    return <Navigate to="/research" replace />
  }
  return element
}
