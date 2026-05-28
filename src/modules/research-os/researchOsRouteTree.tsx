import { Navigate, Route } from 'react-router-dom'
import DonutOsLayout from './layouts/DonutOsLayout'
import BuilderPage from './pages/BuilderPage'
import SimulatorPage from './pages/SimulatorPage'
import ProjectDashboardPage from './pages/ProjectDashboardPage'
import ConnectionsPage from './pages/ConnectionsPage'
import DataVisualizerPage from './pages/DataVisualizerPage'
import ReportPage from './pages/ReportPage'

/** 嵌套在 research/os/* 下的子路由（勿包一层 <Routes>） */
export const researchOsRouteTree = (
  <Route path="os/*" element={<DonutOsLayout />}>
    <Route index element={<Navigate to="builder" replace />} />
    <Route path="hub" element={<Navigate to="builder" replace />} />
    <Route path="builder" element={<BuilderPage />} />
    <Route path="simulator" element={<SimulatorPage />} />
    <Route path="project/:projectId/dashboard" element={<ProjectDashboardPage />} />
    <Route path="project/:projectId/connections" element={<ConnectionsPage />} />
    <Route path="project/:projectId/simulator" element={<SimulatorPage />} />
    <Route path="project/:projectId/visualizer" element={<DataVisualizerPage />} />
    <Route path="project/:projectId/report" element={<ReportPage />} />
    <Route path="project/:projectId/builder" element={<BuilderPage />} />
  </Route>
)
