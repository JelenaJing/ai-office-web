import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginGate from '../components/LoginGate'
import RegisterPage from './pages/RegisterPage'
import AiosHomePage from './pages/AiosHomePage'
import ArtifactLabPage from './pages/ArtifactLabPage'
import HtmlPptPage from './pages/HtmlPptPage'
import RequireAuth from './components/RequireAuth'

export default function WebApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AiosHomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/artifacts/lab"
          element={
            <RequireAuth>
              <ArtifactLabPage />
            </RequireAuth>
          }
        />
        <Route
          path="/ppt"
          element={
            <RequireAuth>
              <HtmlPptPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
