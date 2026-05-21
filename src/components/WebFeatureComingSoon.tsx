import styled from 'styled-components'
import { getWebFeatureStatus, type WebFeatureKey } from '../platform/featureGate'

const Shell = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f8fbfe 0%, #eef4f9 100%);
  color: #7b92b0;
  gap: 12px;
  padding: 40px;
  text-align: center;
  min-height: 0;
`

const Title = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #4a6fa5;
`

const Desc = styled.div`
  font-size: 14px;
  color: #a0afc0;
  max-width: 360px;
  line-height: 1.6;
`

interface WebFeatureComingSoonProps {
  featureKey?: WebFeatureKey
  /** Override display name when no featureKey applies */
  title?: string
}

/** Full-panel placeholder when a Web feature is not yet migrated. */
export default function WebFeatureComingSoon({ featureKey, title }: WebFeatureComingSoonProps) {
  const status = featureKey ? getWebFeatureStatus(featureKey) : null
  const label = title ?? status?.label ?? '该功能'
  const message = status?.message ?? 'Web 版即将开放'
  return (
    <Shell>
      <Title>🚀 {message}</Title>
      <Desc>
        {label}功能正在迁移到 Web 服务版，敬请期待。桌面版（Electron）可继续使用完整功能。
      </Desc>
    </Shell>
  )
}
