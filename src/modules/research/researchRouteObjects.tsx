import { Navigate, type RouteObject } from 'react-router-dom'
import type { ReactNode } from 'react'
import ResearchModuleShell from './layouts/ResearchModuleShell'
import FeaturePageLayout, { featureRouteHandle } from './layouts/FeaturePageLayout'
import ResearchHubHomePage from './pages/ResearchHubHomePage'
import ResearchModelsPage from './pages/ResearchModelsPage'
import ScienceRelayRecommendPage from './pages/ScienceRelayRecommendPage'
import ResearchElnPage from './pages/ResearchElnPage'
import TemplatePlotPage from './pages/TemplatePlotPage'
import ResearchLiteratureToolPage from './pages/ResearchLiteratureToolPage'
import { PolymerRecommendationPage } from '../materials-research/pages/PolymerRecommendationPage'
import { PropertyPredictionPage } from '../materials-research/pages/student/PropertyPredictionPage'
import { BatteryPerformancePage } from '../materials-research/pages/student/BatteryPerformancePage'
import { ElnReviewPage } from '../materials-research/pages/teacher/ElnReviewPage'
import { StudentProgressPage } from '../materials-research/pages/teacher/StudentProgressPage'
import { StudentDatabasesOverviewPage } from '../materials-research/pages/student/StudentDatabasesOverviewPage'
import { StudentMyLibraryPage } from '../materials-research/pages/student/StudentMyLibraryPage'
import { MonomerLibraryPage } from '../materials-research/pages/MonomerLibraryPage'
import { PolymerLibraryPage } from '../materials-research/pages/PolymerLibraryPage'
import { ReactionLibraryPage } from '../materials-research/pages/ReactionLibraryPage'
import { HardCarbonPage } from '../materials-research/pages/HardCarbonPage'
import { KnowledgePage } from '../materials-research/pages/KnowledgePage'
import { ReadonlyDatabaseShell } from '../materials-research/components/databases/ReadonlyDatabaseShell'
import { ResearchEntryRedirect } from '../research-os/ResearchOsRoutes'
import DonutOsLayout from '../research-os/layouts/DonutOsLayout'
import BuilderPage from '../research-os/pages/BuilderPage'
import SimulatorPage from '../research-os/pages/SimulatorPage'
import ProjectDashboardPage from '../research-os/pages/ProjectDashboardPage'
import ConnectionsPage from '../research-os/pages/ConnectionsPage'
import DataVisualizerPage from '../research-os/pages/DataVisualizerPage'
import ReportPage from '../research-os/pages/ReportPage'
import ResearchWorkspaceLayout from './ResearchWorkspaceLayout'

function ReadonlyDb({ children }: { children: ReactNode }) {
  return <ReadonlyDatabaseShell>{children}</ReadonlyDatabaseShell>
}

/** 科研模块路由表（由 ResearchWorkspaceRouter 通过 useRoutes 挂载，避免 App 嵌套 Outlet 匹配失败） */
export const researchRouteObjects: RouteObject[] = [
  {
    path: 'research',
    element: <ResearchWorkspaceLayout />,
    children: [
      {
        path: 'os',
        element: <DonutOsLayout />,
        children: [
          { index: true, element: <Navigate to="builder" replace /> },
          { path: 'hub', element: <Navigate to="builder" replace /> },
          { path: 'builder', element: <BuilderPage /> },
          { path: 'simulator', element: <SimulatorPage /> },
          { path: 'project/:projectId/dashboard', element: <ProjectDashboardPage /> },
          { path: 'project/:projectId/connections', element: <ConnectionsPage /> },
          { path: 'project/:projectId/simulator', element: <SimulatorPage /> },
          { path: 'project/:projectId/visualizer', element: <DataVisualizerPage /> },
          { path: 'project/:projectId/report', element: <ReportPage /> },
          { path: 'project/:projectId/builder', element: <BuilderPage /> },
        ],
      },
      {
        element: <ResearchModuleShell />,
        children: [
          { index: true, element: <ResearchHubHomePage /> },
          { path: 'recommend', element: <ScienceRelayRecommendPage /> },
          { path: 'eln', element: <ResearchElnPage /> },
          { path: 'models', element: <ResearchModelsPage /> },
          { path: 'database', element: <StudentDatabasesOverviewPage /> },
          { path: 'database/my-library', element: <StudentMyLibraryPage /> },
          { path: 'database/monomers', element: <ReadonlyDb><MonomerLibraryPage /></ReadonlyDb> },
          { path: 'database/papers', element: <ReadonlyDb><KnowledgePage /></ReadonlyDb> },
          { path: 'database/battery-materials', element: <ReadonlyDb><HardCarbonPage /></ReadonlyDb> },
          { path: 'database/polymers', element: <ReadonlyDb><PolymerLibraryPage /></ReadonlyDb> },
          { path: 'database/reactions', element: <ReadonlyDb><ReactionLibraryPage /></ReadonlyDb> },
        ],
      },
      {
        element: <FeaturePageLayout />,
        children: [
          { path: 'tools/ideas', element: <Navigate to="/research/recommend" replace /> },
          {
            path: 'tools/plot',
            element: <TemplatePlotPage />,
            handle: featureRouteHandle('模板画图', '实验数据 → matplotlib 科研图'),
          },
          {
            path: 'tools/literature',
            element: <ResearchLiteratureToolPage />,
            handle: featureRouteHandle('每日论文推荐'),
          },
          {
            path: 'tools/formulation',
            element: <PolymerRecommendationPage />,
            handle: featureRouteHandle('配方推荐'),
          },
          {
            path: 'tools/property',
            element: <PropertyPredictionPage />,
            handle: featureRouteHandle('性能预测'),
          },
          {
            path: 'tools/battery',
            element: <BatteryPerformancePage />,
            handle: featureRouteHandle('电池性能预测'),
          },
          {
            path: 'tools/materials',
            element: <ReadonlyDb><HardCarbonPage /></ReadonlyDb>,
            handle: featureRouteHandle('硬碳选材库'),
          },
          { path: 'tools/eln', element: <Navigate to="/research/eln" replace /> },
          {
            path: 'tools/teacher/eln-review',
            element: <ElnReviewPage />,
            handle: featureRouteHandle('实验记录审核'),
          },
          {
            path: 'tools/teacher/students',
            element: <StudentProgressPage />,
            handle: featureRouteHandle('学生进展'),
          },
        ],
      },
      { path: 'home', element: <Navigate to="/research" replace /> },
      { path: 'classic', element: <Navigate to="/research/os/builder" replace /> },
      { path: 'dashboard', element: <Navigate to="/research/os/builder" replace /> },
      { path: 'ideas', element: <Navigate to="/research/recommend" replace /> },
      { path: 'plot', element: <Navigate to="/research/tools/plot" replace /> },
      { path: 'databases', element: <Navigate to="/research/database" replace /> },
      { path: 'literature/*', element: <Navigate to="/research/tools/literature" replace /> },
      { path: 'polymer/*', element: <Navigate to="/research/tools/formulation" replace /> },
      { path: 'battery/*', element: <Navigate to="/research/tools/battery" replace /> },
      { path: '*', element: <ResearchEntryRedirect /> },
    ],
  },
]
