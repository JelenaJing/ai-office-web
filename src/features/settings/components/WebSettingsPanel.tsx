import { useEffect, useState } from 'react'
import { platformApi } from '../../../platform'
import type { AiSettingsView } from '../../../platform'
import {
  MvpBtn, MvpCard, MvpError, MvpHint, MvpPage, MvpTitle,
} from '../../../components/web/WebMvpLayout'
import styled from 'styled-components'

const Row = styled.div`
  font-size: 14px;
  color: #304255;
  padding: 6px 0;
`

export default function WebSettingsPanel() {
  const [settings, setSettings] = useState<AiSettingsView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    void platformApi.settings.getAi().then(setSettings).catch((e) => {
      setError(e instanceof Error ? e.message : '加载失败')
    })
  }, [])

  const runTest = async () => {
    setTesting(true)
    setTestMsg(null)
    setError(null)
    try {
      const r = await platformApi.settings.testAi()
      setTestMsg(r.ok ? `✅ ${r.message}` : `❌ ${r.message}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '测试失败')
    } finally {
      setTesting(false)
    }
  }

  return (
    <MvpPage>
      <MvpCard>
        <MvpTitle>AI 配置（只读）</MvpTitle>
        <MvpHint>API Key 由服务器管理员在环境变量中配置，浏览器无法写入或查看密钥。</MvpHint>
        {error && <MvpError>{error}</MvpError>}
        {settings && (
          <>
            <Row>Provider：{settings.provider || '—'}</Row>
            <Row>Model：{settings.model || '—'}</Row>
            <Row>Base URL：{settings.baseUrl || '—'}</Row>
            <Row>API Key：{settings.hasApiKey ? '已配置' : '未配置'}</Row>
            <Row>图片服务：{settings.imageConfigured ? '已配置' : '未配置'}</Row>
          </>
        )}
        <MvpBtn disabled={testing} onClick={() => void runTest()}>
          {testing ? '测试中…' : '测试 LLM 连接'}
        </MvpBtn>
        {testMsg && <MvpHint>{testMsg}</MvpHint>}
      </MvpCard>
    </MvpPage>
  )
}
