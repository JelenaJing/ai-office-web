import React, { useState } from 'react'
import styled from 'styled-components'
import type { DecisionPackage } from '../types'
import * as matterRuntime from '../services/matterRuntime'

interface Props {
  matterId: string
  pkg: DecisionPackage | undefined
  onPackageGenerated: (pkg: DecisionPackage) => void
}

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const GenerateBtn = styled.button`
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: 0.9; }
`

const Section = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
`

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`

const SectionBody = styled.div`
  font-size: 13px;
  color: #2d3748;
  line-height: 1.6;
`

const BulletList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  li { font-size: 13px; color: #2d3748; line-height: 1.5; }
`

const MetaRow = styled.div`
  font-size: 11px;
  color: #a0aec0;
  text-align: right;
  margin-top: 4px;
`

const ErrorMsg = styled.div`
  color: #e53e3e;
  font-size: 13px;
  text-align: center;
  padding: 8px 0;
`

const EmptyHint = styled.div`
  text-align: center;
  color: #a0aec0;
  font-size: 13px;
  padding: 20px 0;
`

export default function DecisionPackagePanel({ matterId, pkg, onPackageGenerated }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const generated = await matterRuntime.generateDecisionPackage(matterId)
      onPackageGenerated(generated)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell>
      <GenerateBtn onClick={handleGenerate} disabled={loading}>
        {loading ? '⏳ 生成中…' : '🧠 生成 / 重新生成决策包'}
      </GenerateBtn>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {!pkg && !loading && (
        <EmptyHint>点击上方按钮，基于当前事项和证据自动生成结构化决策包。</EmptyHint>
      )}

      {pkg && (
        <>
          <Section>
            <SectionTitle>📋 事项摘要</SectionTitle>
            <SectionBody>{pkg.summary}</SectionBody>
          </Section>

          <Section>
            <SectionTitle>✅ 已知事实</SectionTitle>
            <BulletList>
              {pkg.knownFacts.map((f, i) => <li key={i}>{f}</li>)}
            </BulletList>
          </Section>

          <Section>
            <SectionTitle>❓ 缺失材料</SectionTitle>
            <BulletList>
              {pkg.missingMaterials.map((m, i) => <li key={i}>{m}</li>)}
            </BulletList>
          </Section>

          <Section>
            <SectionTitle>⚠️ 风险点</SectionTitle>
            <BulletList>
              {pkg.riskPoints.map((r, i) => <li key={i}>{r}</li>)}
            </BulletList>
          </Section>

          <Section>
            <SectionTitle>💡 建议动作</SectionTitle>
            <BulletList>
              {pkg.suggestedActions.map((a, i) => <li key={i}>{a}</li>)}
            </BulletList>
          </Section>

          <MetaRow>生成时间：{new Date(pkg.generatedAt).toLocaleString('zh-CN')}</MetaRow>
        </>
      )}
    </Shell>
  )
}
