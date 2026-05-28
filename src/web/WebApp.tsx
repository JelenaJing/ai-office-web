import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginGate from '../components/LoginGate'
import RegisterPage from './pages/RegisterPage'
import ArtifactLabPage from './pages/ArtifactLabPage'
import RequireAuth from './components/RequireAuth'
import App from '../App'
import { DEFAULT_APP_ROUTE } from '../config/productFeatures'
import { useInternalAccount } from '../contexts/InternalAccountContext'
import { DISABLE_FORCE_PASSWORD_CHANGE } from '../config'

function LoginRoute() {
  const { state } = useInternalAccount()
  const loggedIn =
    state.phase === 'logged_in' ||
    (state.phase === 'must_change_password' && DISABLE_FORCE_PASSWORD_CHANGE)
  if (loggedIn) {
    return <Navigate to={DEFAULT_APP_ROUTE} replace />
  }
  return <LoginGate />
}

function RegisterRoute() {
  const { state } = useInternalAccount()
  const loggedIn =
    state.phase === 'logged_in' ||
    (state.phase === 'must_change_password' && DISABLE_FORCE_PASSWORD_CHANGE)
  if (loggedIn) {
    return <Navigate to={DEFAULT_APP_ROUTE} replace />
  }
  return <RegisterPage />
}

export default function WebApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/register" element={<RegisterRoute />} />
        <Route
          path="/artifacts/lab"
          element={
            <RequireAuth>
              <ArtifactLabPage />
            </RequireAuth>
          }
        />
        <Route path="/" element={<Navigate to={DEFAULT_APP_ROUTE} replace />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <App />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
