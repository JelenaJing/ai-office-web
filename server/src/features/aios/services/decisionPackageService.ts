/**
 * decisionPackageService.ts — Generate structured decision packages from
 * Matter + Evidence without requiring live AI (rule-based first version).
 *
 * A later Sprint can swap the generation logic with a real LLM skill call
 * without changing the API contract.
 */

import { readMatters, writeMatters } from './matterStore'
import { getEvidence } from './matterService'
import { logAudit } from './auditTrailService'
import type { DecisionPackage, Matter, MatterEvidence } from '../types'

const STATUS_LABEL: Record<string, string> = {
  new: '新建',
  todo: '待处理',
  doing: '处理中',
  waiting: '等待中',
  done: '已完成',
  archived: '已归档',
}

const PRIORITY_LABEL: Record<string, string> = {
  urgent: '紧急',
  important: '重要',
  normal: '普通',
  low: '低优先',
}

function buildSummary(matter: Matter): string {
  return `事项「${matter.title}」（优先级：${PRIORITY_LABEL[matter.priority] ?? matter.priority}，当前状态：${STATUS_LABEL[matter.status] ?? matter.status}）。目标：${matter.goal || '（未填写）'}。`
}

function buildKnownFacts(evidence: MatterEvidence[]): string[] {
  if (evidence.length === 0) return ['暂无已收集证据材料。']
  return evidence.map(e => {
    const typeLabel =
      { email: '邮件', attachment: '附件', file: '文件', note: '备注', knowledge: '知识库' }[
        e.type
      ] ?? e.type
    return `[${typeLabel}] ${e.title}${e.content ? '：' + e.content.slice(0, 120) + (e.content.length > 120 ? '…' : '') : ''}`
  })
}

function buildMissingMaterials(matter: Matter, evidence: MatterEvidence[]): string[] {
  const missing: string[] = []
  const hasEmail = evidence.some(e => e.type === 'email')
  const hasFile = evidence.some(e => e.type === 'file' || e.type === 'attachment')
  const hasNote = evidence.some(e => e.type === 'note')

  if (!hasEmail && matter.sourceType === 'email') {
    missing.push('缺少原始邮件附件或正文截图')
  }
  if (!hasFile && (matter.sourceType === 'document' || matter.sourceType === 'upload')) {
    missing.push('缺少原始文件或上传材料')
  }
  if (!hasNote) {
    missing.push('建议添加处理备注或决策说明')
  }
  if (evidence.length < 2) {
    missing.push('证据材料较少，建议补充更多相关文件或邮件')
  }
  if (!matter.goal?.trim()) {
    missing.push('事项目标描述为空，建议补充清晰目标')
  }
  return missing.length > 0 ? missing : ['材料相对齐全，可进入决策阶段。']
}

function buildRiskPoints(matter: Matter, evidence: MatterEvidence[]): string[] {
  const risks: string[] = []
  if (matter.priority === 'urgent') {
    risks.push('⚡ 该事项被标记为紧急，需尽快决策或上报。')
  }
  if (matter.status === 'waiting') {
    risks.push('⏳ 事项处于等待状态，存在阻塞风险，需确认等待原因并推进。')
  }
  if (evidence.length === 0) {
    risks.push('⚠️ 无任何证据材料，决策依据不足。')
  }
  const now = Date.now()
  const age = now - new Date(matter.createdAt).getTime()
  const ageDays = Math.floor(age / (1000 * 60 * 60 * 24))
  if (ageDays > 7 && matter.status !== 'done' && matter.status !== 'archived') {
    risks.push(`📅 事项已创建 ${ageDays} 天，尚未完成，注意超期风险。`)
  }
  return risks.length > 0 ? risks : ['暂无明显风险点。']
}

function buildSuggestedActions(matter: Matter, evidence: MatterEvidence[]): string[] {
  const actions: string[] = []
  if (matter.status === 'new') {
    actions.push('将事项状态更新为「待处理」，分配优先级。')
  }
  if (matter.status === 'todo') {
    actions.push('开始处理事项，将状态更新为「处理中」。')
  }
  if (evidence.length === 0) {
    actions.push('上传或关联相关材料（文件/邮件/备注）作为证据。')
  }
  if (!matter.goal?.trim()) {
    actions.push('补充事项目标描述，便于后续追踪。')
  }
  if (matter.priority === 'urgent' && matter.status !== 'done') {
    actions.push('紧急事项：立即联系相关责任人，确认处理进展。')
  }
  actions.push('生成决策包后，将其导出或分享给相关人员审阅。')
  return actions
}

export function generateDecisionPackage(
  userId: string,
  matterId: string,
): DecisionPackage | null {
  const { matters } = readMatters(userId)
  const matter = matters.find(m => m.id === matterId && m.userId === userId)
  if (!matter) return null

  const evidence = getEvidence(userId, matterId)

  const pkg: DecisionPackage = {
    matterId,
    generatedAt: new Date().toISOString(),
    summary: buildSummary(matter),
    knownFacts: buildKnownFacts(evidence),
    missingMaterials: buildMissingMaterials(matter, evidence),
    riskPoints: buildRiskPoints(matter, evidence),
    suggestedActions: buildSuggestedActions(matter, evidence),
  }

  // Persist decision package onto the matter
  const mIdx = matters.findIndex(m => m.id === matterId)
  if (mIdx !== -1) {
    matters[mIdx].decisionPackage = pkg
    matters[mIdx].updatedAt = new Date().toISOString()
    writeMatters(userId, { matters })
  }

  logAudit(userId, matterId, 'generate_decision_package', {
    evidenceCount: evidence.length,
    generatedAt: pkg.generatedAt,
  })

  return pkg
}
