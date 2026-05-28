import { useState } from 'react'
import {
  getApiEntryMode,
  getAuthToken,
  setApiEntryMode,
  setAuthToken,
  type ApiEntryMode,
} from '../api/apiBase'

export default function TestConfigBar() {
  const [mode, setMode] = useState<ApiEntryMode>(getApiEntryMode())
  const [token, setToken] = useState(getAuthToken())

  return (
    <header className="research-test-bar">
      <div className="research-test-bar__title">
        <strong>科研工作台</strong>
        <span>UI :25176 · BFF :13001 · FastAPI :18020</span>
      </div>
      <div className="research-test-bar__controls">
        <label>
          API 入口
          <select
            value={mode}
            onChange={(e) => {
              const next = e.target.value as ApiEntryMode
              setMode(next)
              setApiEntryMode(next)
            }}
          >
            <option value="bff">BFF :13001 /api/research</option>
            <option value="fastapi-v2">FastAPI v2 :18020</option>
          </select>
        </label>
        <label>
          Bearer Token（BFF 必填）
          <input
            type="text"
            value={token}
            placeholder="aios_auth_token"
            onChange={(e) => {
              setToken(e.target.value)
              setAuthToken(e.target.value)
            }}
          />
        </label>
      </div>
    </header>
  )
}
