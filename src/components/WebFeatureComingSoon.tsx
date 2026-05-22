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
  gap: 14px;
  padding: 40px;
  text-align: center;
  min-height: 0;
`

const FeatureName = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1a2f47;
`

const StatusLine = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #4a6fa5;
`

const Desc = styled.div`
  font-size: 14px;
  color: #8094a8;
  max-width: 400px;
  line-height: 1.65;
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
  return (
    <Shell>
      <FeatureName>{label}</FeatureName>
      <StatusLine>当前状态：Web 版正在迁移</StatusLine>
      <Desc>
        说明：{label}的 Web 服务版正在接入中，本页暂不可用。桌面版（Electron）可继续使用完整功能。
      </Desc>
    </Shell>
  )
}
