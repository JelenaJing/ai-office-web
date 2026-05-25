import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { clientPath, indexPath, sanitize, userRoot, workspaceDir, writeIndex, type WorkspaceEntry, type WorkspaceIndex } from './workspaceStore'
import type { StoredEmailAccount } from '../features/email/services/emailStore'

const ARTIFACT_INDEX_PATH = path.resolve(__dirname, '../../data/artifacts/index.json')
const EMAIL_ROOT = path.resolve(__dirname, '../../data/email')
const AIOS_ROOT = path.resolve(__dirname, '../../data/aios')
const CALENDAR_ROOT = path.resolve(__dirname, '../../data/calendar')

interface ArtifactIndexEntry {
  artifactId: string
  userId: string
  workspaceId: string
}

interface ArtifactIndex {
  artifacts: ArtifactIndexEntry[]
}

interface MatterRecord {
  id: string
  userId?: string
  tenantId?: string
  workspacePath?: string
  [key: string]: unknown
}

interface EvidenceRecord {
  id: string
  [key: string]: unknown
}

interface LegacyMigrationResult {
  migrated: boolean
  workspaceIdMap: Map<string, string>
  workspacePathMap: Map<string, string>
}

export interface RepairLegacyUserStateInput {
  canonicalUserId: string
  canonicalUsername?: string
  canonicalEmail?: string
  login?: string
  connectedMailboxEmail?: string
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function stableTenantId(userId: string): string {
  return `personal-tenant-${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return fallback
  }
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
}

function readWorkspaceIndexIfExists(userId: string): WorkspaceIndex {
  const root = userRoot(userId)
  if (!fs.existsSync(root)) return { workspaces: [] }
  return readJsonFile(indexPath(userId), { workspaces: [] })
}

function collectLegacyWorkspaceEntries(legacyUserId: string): WorkspaceEntry[] {
  const root = userRoot(legacyUserId)
  if (!fs.existsSync(root)) return []
  const index = readWorkspaceIndexIfExists(legacyUserId)
  const known = new Map(index.workspaces.map((entry) => [entry.id, entry]))
  for (const dirent of fs.readdirSync(root, { withFileTypes: true })) {
    if (!dirent.isDirectory() || known.has(dirent.name)) continue
    const metaPath = path.join(root, dirent.name, 'workspace.json')
    const meta = readJsonFile<Record<string, unknown> | null>(metaPath, null)
    const createdAt = normalizeString(meta?.createdAt) || new Date().toISOString()
    known.set(dirent.name, {
      id: dirent.name,
      name: normalizeString(meta?.name) || dirent.name,
      path: clientPath(legacyUserId, dirent.name),
      createdAt,
      modifiedAt: normalizeString(meta?.updatedAt) || createdAt,
      isDefault: Boolean(meta?.isDefault),
    })
  }
  return Array.from(known.values())
}

function uniqueWorkspaceName(existing: WorkspaceEntry[], desiredName: string): string {
  const base = normalizeString(desiredName) || '工作区'
  if (!existing.some((entry) => entry.name === base)) return base
  let suffix = 2
  while (existing.some((entry) => entry.name === `${base}（迁移 ${suffix}）`)) suffix += 1
  return `${base}（迁移 ${suffix}）`
}

function rewriteArtifactMetadata(dir: string, canonicalUserId: string, workspaceId: string): void {
  const artifactsRoot = path.join(dir, 'artifacts')
  if (!fs.existsSync(artifactsRoot)) return
  for (const dirent of fs.readdirSync(artifactsRoot, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue
    const metaPath = path.join(artifactsRoot, dirent.name, 'artifact.json')
    const meta = readJsonFile<Record<string, unknown> | null>(metaPath, null)
    if (!meta) continue
    meta.userId = canonicalUserId
    meta.workspaceId = workspaceId
    meta.workspacePath = clientPath(canonicalUserId, workspaceId)
    writeJsonFile(metaPath, meta)
  }
}

function rewriteWorkspaceMetadata(dir: string, canonicalUserId: string, workspaceId: string, workspaceName: string): void {
  const metaPath = path.join(dir, 'workspace.json')
  const now = new Date().toISOString()
  const meta = readJsonFile<Record<string, unknown>>(metaPath, {})
  const memberships = Array.isArray(meta.memberships)
    ? meta.memberships
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => {
          const record = entry as Record<string, unknown>
          return {
            ...record,
            userId: canonicalUserId,
            role: typeof record.role === 'string' ? record.role : 'owner',
            updatedAt: now,
          }
        })
    : [{ userId: canonicalUserId, role: 'owner', createdAt: now, updatedAt: now }]
  meta.id = workspaceId
  meta.name = workspaceName
  meta.ownerUserId = canonicalUserId
  meta.tenantId = stableTenantId(canonicalUserId)
  meta.path = clientPath(canonicalUserId, workspaceId)
  meta.updatedAt = now
  meta.memberships = memberships
  writeJsonFile(metaPath, meta)
  rewriteArtifactMetadata(dir, canonicalUserId, workspaceId)
}

function updateArtifactIndex(legacyUserId: string, canonicalUserId: string, workspaceIdMap: Map<string, string>): void {
  if (!fs.existsSync(ARTIFACT_INDEX_PATH)) return
  const index = readJsonFile<ArtifactIndex>(ARTIFACT_INDEX_PATH, { artifacts: [] })
  let changed = false
  index.artifacts = index.artifacts.map((entry) => {
    if (entry.userId !== legacyUserId) return entry
    changed = true
    return {
      ...entry,
      userId: canonicalUserId,
      workspaceId: workspaceIdMap.get(entry.workspaceId) ?? entry.workspaceId,
    }
  })
  if (changed) writeJsonFile(ARTIFACT_INDEX_PATH, index)
}

function normalizeDefaultWorkspace(entries: WorkspaceEntry[]): WorkspaceEntry[] {
  const list = entries.slice()
  const defaultIndex = list.findIndex((entry) => entry.isDefault)
  if (defaultIndex === -1 && list[0]) {
    list[0] = { ...list[0], isDefault: true }
    return list
  }
  return list.map((entry, index) => ({ ...entry, isDefault: index === defaultIndex }))
}

function migrateWorkspaceData(legacyUserId: string, canonicalUserId: string): LegacyMigrationResult {
  const legacyRoot = userRoot(legacyUserId)
  if (!fs.existsSync(legacyRoot)) {
    return { migrated: false, workspaceIdMap: new Map(), workspacePathMap: new Map() }
  }

  const legacyEntries = collectLegacyWorkspaceEntries(legacyUserId)
  const canonicalEntries = readWorkspaceIndexIfExists(canonicalUserId).workspaces
  const mergedEntries = canonicalEntries.slice()
  const usedIds = new Set(canonicalEntries.map((entry) => entry.id))
  const workspaceIdMap = new Map<string, string>()
  const workspacePathMap = new Map<string, string>()
  let migrated = false

  fs.mkdirSync(userRoot(canonicalUserId), { recursive: true })

  for (const legacyEntry of legacyEntries) {
    const legacyDir = workspaceDir(legacyUserId, legacyEntry.id)
    if (!fs.existsSync(legacyDir)) continue
    let nextId = legacyEntry.id
    if (usedIds.has(nextId) || fs.existsSync(workspaceDir(canonicalUserId, nextId))) {
      nextId = randomUUID()
    }
    const nextName = uniqueWorkspaceName(mergedEntries, legacyEntry.name)
    const nextPath = clientPath(canonicalUserId, nextId)
    const nextDir = workspaceDir(canonicalUserId, nextId)
    fs.renameSync(legacyDir, nextDir)
    rewriteWorkspaceMetadata(nextDir, canonicalUserId, nextId, nextName)
    mergedEntries.push({
      ...legacyEntry,
      id: nextId,
      name: nextName,
      path: nextPath,
      isDefault: !mergedEntries.some((entry) => entry.isDefault) && Boolean(legacyEntry.isDefault),
    })
    usedIds.add(nextId)
    workspaceIdMap.set(legacyEntry.id, nextId)
    workspacePathMap.set(clientPath(legacyUserId, legacyEntry.id), nextPath)
    migrated = true
  }

  if (migrated) {
    writeIndex(canonicalUserId, { workspaces: normalizeDefaultWorkspace(mergedEntries) })
    updateArtifactIndex(legacyUserId, canonicalUserId, workspaceIdMap)
  }

  try {
    fs.rmSync(legacyRoot, { recursive: true, force: true })
  } catch {
    // Best effort: stale empty roots are harmless.
  }

  return { migrated, workspaceIdMap, workspacePathMap }
}

function rewriteWorkspacePath(
  value: unknown,
  legacyUserId: string,
  canonicalUserId: string,
  workspacePathMap: Map<string, string>,
): string | undefined {
  const raw = normalizeString(value)
  if (!raw) return undefined
  const mapped = workspacePathMap.get(raw)
  if (mapped) return mapped
  const prefix = `web-workspace:${legacyUserId}:`
  if (!raw.startsWith(prefix)) return raw
  return `web-workspace:${canonicalUserId}:${raw.slice(prefix.length)}`
}

function mergeUniqueById<T extends { id: string }>(left: T[], right: T[]): T[] {
  const byId = new Map<string, T>()
  for (const item of left) byId.set(item.id, item)
  for (const item of right) {
    if (!byId.has(item.id)) byId.set(item.id, item)
  }
  return Array.from(byId.values())
}

function migrateAiosData(
  legacyUserId: string,
  canonicalUserId: string,
  workspacePathMap: Map<string, string>,
): boolean {
  const legacyDir = path.join(AIOS_ROOT, legacyUserId)
  if (!fs.existsSync(legacyDir)) return false
  const canonicalDir = path.join(AIOS_ROOT, canonicalUserId)
  const canonicalMatters = readJsonFile<{ matters: MatterRecord[] }>(path.join(canonicalDir, 'matters.json'), { matters: [] })
  const legacyMatters = readJsonFile<{ matters: MatterRecord[] }>(path.join(legacyDir, 'matters.json'), { matters: [] })
  const canonicalEvidence = readJsonFile<{ evidence: EvidenceRecord[] }>(path.join(canonicalDir, 'evidence.json'), { evidence: [] })
  const legacyEvidence = readJsonFile<{ evidence: EvidenceRecord[] }>(path.join(legacyDir, 'evidence.json'), { evidence: [] })

  const migratedMatters = legacyMatters.matters.map((matter) => ({
    ...matter,
    userId: canonicalUserId,
    tenantId: stableTenantId(canonicalUserId),
    workspacePath: rewriteWorkspacePath(matter.workspacePath, legacyUserId, canonicalUserId, workspacePathMap),
  }))

  writeJsonFile(path.join(canonicalDir, 'matters.json'), {
    matters: mergeUniqueById(canonicalMatters.matters, migratedMatters),
  })
  writeJsonFile(path.join(canonicalDir, 'evidence.json'), {
    evidence: mergeUniqueById(canonicalEvidence.evidence, legacyEvidence.evidence),
  })

  const legacyAuditPath = path.join(legacyDir, 'audit.jsonl')
  if (fs.existsSync(legacyAuditPath)) {
    const canonicalAuditPath = path.join(canonicalDir, 'audit.jsonl')
    fs.mkdirSync(path.dirname(canonicalAuditPath), { recursive: true })
    const legacyAudit = fs.readFileSync(legacyAuditPath, 'utf-8')
    if (legacyAudit.trim()) {
      fs.appendFileSync(canonicalAuditPath, legacyAudit.endsWith('\n') ? legacyAudit : `${legacyAudit}\n`, 'utf-8')
    }
  }

  try {
    fs.rmSync(legacyDir, { recursive: true, force: true })
  } catch {
    // Best effort: stale empty roots are harmless.
  }
  return migratedMatters.length > 0 || legacyEvidence.evidence.length > 0 || fs.existsSync(legacyAuditPath)
}

function calendarFilePath(userId: string): string {
  return path.join(CALENDAR_ROOT, `${sanitize(userId)}.json`)
}

function migrateCalendarData(legacyUserId: string, canonicalUserId: string): boolean {
  const legacyPath = calendarFilePath(legacyUserId)
  if (!fs.existsSync(legacyPath)) return false
  const canonicalPath = calendarFilePath(canonicalUserId)
  const canonical = readJsonFile<{ events: Array<{ id: string }> }>(canonicalPath, { events: [] })
  const legacy = readJsonFile<{ events: Array<{ id: string }> }>(legacyPath, { events: [] })
  writeJsonFile(canonicalPath, { events: mergeUniqueById(canonical.events, legacy.events) })
  fs.renameSync(legacyPath, path.join(CALENDAR_ROOT, `${sanitize(legacyUserId)}.merged-into-${sanitize(canonicalUserId)}.json`))
  return legacy.events.length > 0
}

function emailFilePath(userId: string): string {
  return path.join(EMAIL_ROOT, `${sanitize(userId)}.json`)
}

function migrateEmailData(legacyUserId: string, canonicalUserId: string, canonicalUsername?: string): boolean {
  const legacyPath = emailFilePath(legacyUserId)
  if (!fs.existsSync(legacyPath)) return false
  const canonicalPath = emailFilePath(canonicalUserId)
  const legacyAccount = readJsonFile<StoredEmailAccount | null>(legacyPath, null)
  if (!legacyAccount) return false
  const canonicalAccount = readJsonFile<StoredEmailAccount | null>(canonicalPath, null)
  if (!canonicalAccount) {
    writeJsonFile(canonicalPath, {
      ...legacyAccount,
      ownerUserId: canonicalUserId,
      ownerUsername: canonicalUsername,
      status: legacyAccount.status || 'connected',
    })
  }
  fs.renameSync(legacyPath, path.join(EMAIL_ROOT, `${sanitize(legacyUserId)}.merged-into-${sanitize(canonicalUserId)}.json`))
  return true
}

function legacyIdCandidates(input: RepairLegacyUserStateInput): string[] {
  const candidates = new Set<string>()
  const addEmail = (value: unknown) => {
    const email = normalizeString(value).toLowerCase()
    if (!email || !email.includes('@')) return
    candidates.add(email)
    candidates.add(`mailbox:${email}`)
  }
  addEmail(input.canonicalEmail)
  addEmail(input.login)
  addEmail(input.connectedMailboxEmail)
  candidates.delete(input.canonicalUserId)
  return Array.from(candidates)
}

export function repairLegacyUserState(input: RepairLegacyUserStateInput): { migratedLegacyUserIds: string[] } {
  const migratedLegacyUserIds: string[] = []
  for (const legacyUserId of legacyIdCandidates(input)) {
    const workspaceMigration = migrateWorkspaceData(legacyUserId, input.canonicalUserId)
    const aiosMigrated = migrateAiosData(legacyUserId, input.canonicalUserId, workspaceMigration.workspacePathMap)
    const calendarMigrated = migrateCalendarData(legacyUserId, input.canonicalUserId)
    const emailMigrated = migrateEmailData(legacyUserId, input.canonicalUserId, input.canonicalUsername)
    if (workspaceMigration.migrated || aiosMigrated || calendarMigrated || emailMigrated) {
      migratedLegacyUserIds.push(legacyUserId)
    }
  }
  return { migratedLegacyUserIds }
}
