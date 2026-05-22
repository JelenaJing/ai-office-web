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
  draft: '草稿',
  collecting_evidence: '收集证据',
  decision_package_ready: '决策包就绪',
  completed: '已完成',
  new: '新建',
  todo: '待处理',
  doing: '处理中',
  waiting: '等待中',
  done: '已完成',
  archived: '已归档',
}

function buildSourceReferences(evidence: MatterEvidence[]): DecisionPackage['sourceReferences'] {
  return evidence.map((item) => ({
    type: item.type,
    evidenceId: item.id,
    sourceRef: item.sourceRef,
    title: item.title,
    artifactId: item.artifactId,
  }))
}

function resolveKnowledgeVerificationStatus(evidence: MatterEvidence[]): DecisionPackage['knowledgeVerificationStatus'] {
  const knowledge = evidence.filter((item) => item.type === 'knowledge')
  if (knowledge.length === 0) return 'partial'
  if (knowledge.every((item) => item.knowledgeVerificationStatus === 'verified')) return 'verified'
  if (knowledge.some((item) => item.knowledgeVerificationStatus === 'unverified')) return 'unverified'
  return 'partial'
}

const PRIORITY_LABEL: Record<string, string> = {
  urgent: '紧急',
  important: '重要',
  normal: '普通',
  low: '低优先',
}

function buildSummary(matter: Matter, hasEmailEvidence: boolean): string {
  const sourceLabel = hasEmailEvidence || matter.sourceType === 'email'
    ? '（来源邮件）'
    : matter.sourceType === 'document'
      ? '（来源文档）'
      : matter.sourceType === 'upload'
        ? '（来源上传）'
        : ''
  return `事项「${matter.title}」${sourceLabel}（优先级：${PRIORITY_LABEL[matter.priority] ?? matter.priority}，当前状态：${STATUS_LABEL[matter.status] ?? matter.status}）。目标：${matter.goal || '（未填写）'}。`
}

/** Extract up to 5 key sentences from email body text */
function extractEmailFacts(body: string): string[] {
  const sentences = body
    .split(/[。！？\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 200)
  const KEYWORDS = /需要|请|确认|已|截止|要求|提供|附件|关于|同意|批准|通知|安排|建议|决定|注意|重要|告知/
  const keySentences = sentences.filter(s => KEYWORDS.test(s)).slice(0, 5)
  return keySentences.length > 0 ? keySentences : sentences.slice(0, 3)
}

function buildKnownFacts(evidence: MatterEvidence[]): string[] {
  if (evidence.length === 0) return ['暂无已收集证据材料。']

  const facts: string[] = []
  const emailEvs = evidence.filter(e => e.type === 'email')

  for (const e of emailEvs) {
    facts.push(`[邮件] ${e.title}`)
    if (e.content) {
      const extracted = extractEmailFacts(e.content)
      extracted.forEach(f => facts.push(`  • ${f}`))
    }
  }

  for (const e of evidence.filter(ev => ev.type !== 'email')) {
    const typeLabelMap: Record<string, string> = { attachment: '附件', file: '文件', note: '备注', knowledge: '知识库' }
    const typeLabel = typeLabelMap[e.type] ?? e.type
    facts.push(`[${typeLabel}] ${e.title}${e.content ? '：' + e.content.slice(0, 120) + (e.content.length > 120 ? '…' : '') : ''}`)
  }

  return facts
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

  // Email-specific missing info
  if (hasEmail) {
    const emailEv = evidence.find(e => e.type === 'email')
    if (emailEv?.content) {
      const body = emailEv.content.toLowerCase()
      if (!/签名|联系|电话|手机|邮箱/.test(body)) {
        missing.push('邮件未包含发件人联系方式，如需回复请确认回复地址')
      }
      if (/截止|deadline|due|期限/.test(body) && !/[\d]{1,2}[月\/\-][\d]{1,2}日?/.test(body)) {
        missing.push('邮件提及截止时间但具体日期不明确，需确认')
      }
    }
  }

  return missing.length > 0 ? missing : ['材料相对齐全，可进入决策阶段。']
}

const DEADLINE_RE = /截止|紧急|尽快|立即|今天|明天|下周|urgent|asap|deadline/i
const RISK_WORDS = /责任不明|未经确认|缺少签字|无联系人|待定/i

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

  // Email-specific risks
  const emailEv = evidence.find(e => e.type === 'email')
  if (emailEv?.content) {
    if (DEADLINE_RE.test(emailEv.content)) {
      risks.push('⏰ 邮件中含有时间紧迫信号，注意处理延期风险。')
    }
    if (RISK_WORDS.test(emailEv.content)) {
      risks.push('⚠️ 邮件内容提示责任不清或材料缺失，需进一步确认。')
    }
    const attachmentCount = evidence.filter(e => e.type === 'attachment').length
    if (attachmentCount > 0 && emailEv.content.includes('附件已关联，后续接入文件抽取')) {
      risks.push(`📎 有 ${attachmentCount} 个附件尚未解析，决策前建议确认附件内容。`)
    }
  }

  return risks.length > 0 ? risks : ['暂无明显风险点。']
}

function buildSuggestedActions(matter: Matter, evidence: MatterEvidence[]): string[] {
  const actions: string[] = []
  const hasEmailEvidence = evidence.some(e => e.type === 'email')

  if (matter.status === 'new') {
    actions.push('将事项状态更新为「待处理」，分配优先级。')
  }
  if (matter.status === 'draft') {
    actions.push('进入证据收集阶段，补充邮件、附件、知识库或备注证据。')
  }
  if (matter.status === 'collecting_evidence') {
    actions.push('确认材料是否齐备，生成决策包并进入审阅。')
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

  // Email-specific suggested actions
  if (hasEmailEvidence) {
    actions.push('generate_reply: 回复发件人，确认收到并告知处理进展或询问补充信息。')
    actions.push('generate_document: 根据邮件内容生成相关文档（会议纪要、审批说明、任务清单等）。')
    actions.push('request_more_info: 如材料不足，回复发件人请求提供缺失的附件或信息。')
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
  const hasEmailEvidence = evidence.some(e => e.type === 'email')

  const pkg: DecisionPackage = {
    matterId,
    generatedAt: new Date().toISOString(),
    summary: buildSummary(matter, hasEmailEvidence),
    knownFacts: buildKnownFacts(evidence),
    missingMaterials: buildMissingMaterials(matter, evidence),
    riskPoints: buildRiskPoints(matter, evidence),
    suggestedActions: buildSuggestedActions(matter, evidence),
    sourceReferences: buildSourceReferences(evidence),
    knowledgeVerificationStatus: resolveKnowledgeVerificationStatus(evidence),
  }

  // Persist decision package onto the matter
  const mIdx = matters.findIndex(m => m.id === matterId)
  if (mIdx !== -1) {
    matters[mIdx].decisionPackage = pkg
    const previousStatus = matters[mIdx].status
    matters[mIdx].status = 'decision_package_ready'
    matters[mIdx].updatedAt = new Date().toISOString()
    writeMatters(userId, { matters })
    if (previousStatus !== 'decision_package_ready') {
      logAudit(userId, matterId, 'change_status', {
        from: previousStatus,
        to: 'decision_package_ready',
      })
    }
  }

  logAudit(userId, matterId, 'generate_decision_package', {
    evidenceCount: evidence.length,
    generatedAt: pkg.generatedAt,
  })

  return pkg
}
