import React, { useState, useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useInternalAccount } from '../contexts/InternalAccountContext'
import illustrationBg from '../assets/login/illustration.png'
import logoImage from '../assets/login/logo.png'
import userIcon from '../assets/login/User7.png'

const Screen = styled.div`
  position: fixed;
  inset: 0;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  box-sizing: border-box;
  overflow-y: auto;
  font-family: 'Times New Roman', 'Songti SC', 'SimSun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-image: linear-gradient(rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.12)), url(${illustrationBg});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`

const Card = styled.div`
  width: 420px;
  max-width: 440px;
  padding: 34px 36px 30px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(94, 67, 122, 0.18);
  border-radius: 12px;
  box-shadow: 0 10px 26px rgba(25, 31, 48, 0.16);

  @media (max-width: 640px) {
    width: 90vw;
    max-width: 90vw;
    padding: 28px 22px 24px;
  }
`

const Logo = styled.img`
  display: block;
  width: min(250px, 100%);
  height: auto;
  margin: 0 auto 20px;
`

const Title = styled.div`
  text-align: center;
  color: #3d2d53;
`

const TitlePrimary = styled.div`
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.02em;
`

const TitleSecondary = styled.div`
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.14em;
`

const StaffHint = styled.div`
  margin: 22px 0 20px;
  padding: 12px 14px;
  border-left: 4px solid #6b4b8f;
  background: rgba(107, 75, 143, 0.08);
  color: #4d4260;
  font-size: 14px;
  line-height: 1.7;
`

const Field = styled.div`
  margin-top: 14px;
`

const Label = styled.label`
  display: block;
  margin-bottom: 7px;
  color: #4f405f;
  font-size: 14px;
  font-weight: 600;
`

const InputFrame = styled.div<{ $error?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid ${p => (p.$error ? '#c96565' : '#c9c7d3')};
  border-radius: 7px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus-within {
    border-color: ${p => (p.$error ? '#c96565' : '#6b4b8f')};
    box-shadow: 0 0 0 3px ${p => (p.$error ? 'rgba(201, 101, 101, 0.14)' : 'rgba(107, 75, 143, 0.14)')};
  }
`

const InputIcon = styled.img`
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-left: 12px;
  opacity: 0.72;
`

const Input = styled.input`
  width: 100%;
  padding: 11px 13px;
  border: none;
  outline: none;
  box-sizing: border-box;
  background: transparent;
  color: #2f2a35;
  font-size: 14px;

  &::placeholder {
    color: #8f8898;
  }

  &:disabled {
    color: #9b95a3;
    cursor: not-allowed;
  }
`

const MessageBox = styled.div<{ $warn?: boolean }>`
  margin-top: 14px;
  padding: 11px 13px;
  border-radius: 7px;
  border: 1px solid ${p => (p.$warn ? '#d8c17a' : '#dca6a6')};
  background: ${p => (p.$warn ? 'rgba(252, 247, 226, 0.96)' : 'rgba(255, 245, 245, 0.96)')};
  color: ${p => (p.$warn ? '#6d5922' : '#983f3f')};
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-line;
`

const LoginBtn = styled.button`
  width: 100%;
  margin-top: 22px;
  padding: 12px 14px;
  border: none;
  border-radius: 7px;
  background: #5f3b84;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: #533375;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const Spinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 8px;
  vertical-align: -2px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

export default function LoginGate() {
  const { state, login } = useInternalAccount()
  const [staffEmailPrefix, setStaffEmailPrefix] = useState('')
  const [password, setPassword] = useState('')
  const usernameRef = useRef<HTMLInputElement>(null)

  const submitting = state.phase === 'loading'
  const errorMsg = state.phase === 'error' ? state.message : null
  const isExpiredMsg = !!errorMsg?.includes('登录已过期')
  const isRateLimitMsg = !!errorMsg?.includes('过于频繁')

  useEffect(() => {
    const timer = setTimeout(() => usernameRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const username = staffEmailPrefix.trim()
      if (!username || !password || submitting) return
      const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      console.log(`[LoginGate] submit requestId=${requestId} user=${username}`)
      await login(username, password)
    },
    [login, password, staffEmailPrefix, submitting],
  )

  return (
    <Screen>
      <Card>
        <Logo src={logoImage} alt="CUHK-Shenzhen logo" />

        <Title>
          <TitlePrimary>CUHK-Shenzhen （AI）</TitlePrimary>
        </Title>

        <StaffHint>
          <div>教职工：邮箱前缀</div>
          <div>Staff: Email Prefix</div>
        </StaffHint>

        {isExpiredMsg && <MessageBox $warn>{errorMsg}</MessageBox>}

        <form onSubmit={handleSubmit} autoComplete="on">
          <Field>
            <Label htmlFor="lg-staff-email-prefix">邮箱前缀 / Email Prefix</Label>
            <InputFrame $error={!!errorMsg && !isExpiredMsg}>
              <InputIcon src={userIcon} alt="" aria-hidden="true" />
              <Input
                id="lg-staff-email-prefix"
                ref={usernameRef}
                type="text"
                autoComplete="username"
                value={staffEmailPrefix}
                onChange={e => setStaffEmailPrefix(e.target.value)}
                placeholder="请输入教职工邮箱前缀"
                disabled={submitting}
              />
            </InputFrame>
          </Field>

          <Field>
            <Label htmlFor="lg-password">密码 / Password</Label>
            <InputFrame $error={!!errorMsg && !isExpiredMsg}>
              <Input
                id="lg-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                disabled={submitting}
              />
            </InputFrame>
          </Field>

          {errorMsg && !isExpiredMsg && (
            <MessageBox $warn={isRateLimitMsg}>{errorMsg}</MessageBox>
          )}

          <LoginBtn type="submit" disabled={submitting || !staffEmailPrefix.trim() || !password}>
            {submitting ? (
              <>
                <Spinner />
                登录中...
              </>
            ) : (
              '登录 Login'
            )}
          </LoginBtn>
        </form>
      </Card>
    </Screen>
  )
}
