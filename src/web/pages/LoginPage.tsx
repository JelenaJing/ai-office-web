import LoginGate from '../../components/LoginGate'

/**
 * Legacy /login route wrapper.
 *
 * Web login is unified through LoginGate + InternalAccountContext so even
 * older React Router entries render the same AccountCenter login UI.
 */
export default function LoginPage() {
  return <LoginGate />
}
