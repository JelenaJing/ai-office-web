import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useInternalAccount } from '../../contexts/InternalAccountContext'

/** Redirects unauthenticated users to /login. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useInternalAccount()
  if (state.phase === 'restoring' || state.phase === 'loading') {
    return null
  }
  const isLoggedIn = state.phase === 'logged_in' || state.phase === 'must_change_password'
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
