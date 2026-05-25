import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  clientPath,
  parseClientPath,
  readIndex,
  userRoot,
  workspaceDir,
  writeIndex,
  type WorkspaceEntry,
} from './workspaceStore'

export type WorkspaceRole = 'viewer' | 'member' | 'editor' | 'owner'

interface PersonalTenantRecord {
  id: string
  ownerUserId: string
  type: 'personal'
  name: string
  createdAt: string
  updatedAt: string
}

interface MembershipRecord {
  userId: string
  role: WorkspaceRole
  createdAt: string
  updatedAt: string
}

interface WorkspaceMetadata {
  id: string
  name: string
  ownerUserId: string
  tenantId: string
  path: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
  memberships: MembershipRecord[]
  storage: {
    rootDir: string
    filesDir: string
    artifactsDir: string
  }
}

interface WorkspaceSessionRecord {
  userId: string
  tenant: PersonalTenantRecord
  tenantMemberships: MembershipRecord[]
  workspaceMemberships: MembershipRecord[]
  currentWorkspaceId: string
  currentWorkspacePath: string
  currentWorkspaceName: string
  updatedAt: string
}

export interface WorkspaceBootstrapResult {
  currentUserId: string
  currentTenantId: string
  currentWorkspaceId: string
  currentWorkspacePath: string
  currentWorkspaceName: string
  role: WorkspaceRole
  workspace: {
    id: string
    name: string
    path: string
    isDefault: boolean
    tenantId: string
  }
  created: boolean
}

export interface WorkspaceAccessResult extends WorkspaceBootstrapResult {
  workspaceId: string
  workspacePath: string
  workspaceName: string
}

export class WorkspaceAccessError extends Error {
  readonly code: 'INVALID_WORKSPACE' | 'FORBIDDEN_WORKSPACE' | 'NO_WORKSPACE' | 'INSUFFICIENT_ROLE'
  readonly status: number
  readonly bootstrap?: WorkspaceBootstrapResult

  constructor(
    code: WorkspaceAccessError['code'],
    message: string,
    status: number,
    bootstrap?: WorkspaceBootstrapResult,
  ) {
    super(message)
    this.name = 'WorkspaceAccessError'
    this.code = code
    this.status = status
    this.bootstrap = bootstrap
  }
}

const ROLE_WEIGHT: Record<WorkspaceRole, number> = {
  viewer: 1,
  member: 2,
  editor: 3,
  owner: 4,
}

function tenantMetaPath(userId: string): string {
  return path.join(userRoot(userId), 'tenant.json')
}

function workspaceSessionPath(userId: string): string {
  return path.join(userRoot(userId), 'workspace-session.json')
}

function workspaceMetaPath(userId: string, workspaceId: string): string {
  return path.join(workspaceDir(userId, workspaceId), 'workspace.json')
}

function stableTenantId(userId: string): string {
  return `personal-tenant-${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
}

function listValidWorkspaces(userId: string): WorkspaceEntry[] {
  const index = readIndex(userId)
  const valid = index.workspaces.filter((entry) => fs.existsSync(workspaceDir(userId, entry.id)))
  if (valid.length !== index.workspaces.length) {
    writeIndex(userId, { workspaces: valid })
  }
  return valid
}

function ensureDefaultWorkspaceEntry(userId: string): { entry: WorkspaceEntry; created: boolean } {
  const valid = listValidWorkspaces(userId)
  const now = new Date().toISOString()

  if (valid.length === 0) {
    const workspaceId = randomUUID()
    const entry: WorkspaceEntry = {
      id: workspaceId,
      name: '默认工作区',
      path: clientPath(userId, workspaceId),
      createdAt: now,
      modifiedAt: now,
      isDefault: true,
    }
    const next = { workspaces: [entry] }
    writeIndex(userId, next)
    fs.mkdirSync(path.join(workspaceDir(userId, workspaceId), 'files'), { recursive: true })
    fs.mkdirSync(path.join(workspaceDir(userId, workspaceId), 'artifacts'), { recursive: true })
    return { entry, created: true }
  }

  const existingDefault = valid.find((entry) => entry.isDefault)
  if (existingDefault) return { entry: existingDefault, created: false }

  const [first, ...rest] = valid
  const next = {
    workspaces: [
      { ...first, isDefault: true, modifiedAt: now },
      ...rest.map((entry) => ({ ...entry, isDefault: false })),
    ],
  }
  writeIndex(userId, next)
  return { entry: next.workspaces[0], created: false }
}

function ensurePersonalTenant(userId: string): { tenant: PersonalTenantRecord; created: boolean } {
  const existing = readJsonFile<PersonalTenantRecord>(tenantMetaPath(userId))
  const now = new Date().toISOString()
  if (existing?.id) {
    const tenant = {
      ...existing,
      ownerUserId: userId,
      type: 'personal' as const,
      name: existing.name || '个人租户',
      updatedAt: now,
    }
    writeJsonFile(tenantMetaPath(userId), tenant)
    return { tenant, created: false }
  }

  const tenant: PersonalTenantRecord = {
    id: stableTenantId(userId),
    ownerUserId: userId,
    type: 'personal',
    name: '个人租户',
    createdAt: now,
    updatedAt: now,
  }
  writeJsonFile(tenantMetaPath(userId), tenant)
  return { tenant, created: true }
}

function ensureMembership(
  memberships: MembershipRecord[] | undefined,
  userId: string,
  role: WorkspaceRole,
): { memberships: MembershipRecord[]; created: boolean } {
  const now = new Date().toISOString()
  const list = Array.isArray(memberships) ? memberships.slice() : []
  const existing = list.find((entry) => entry.userId === userId)
  if (existing) {
    const nextRole = ROLE_WEIGHT[existing.role] >= ROLE_WEIGHT[role] ? existing.role : role
    const normalized = list.map((entry) => (
      entry.userId === userId
        ? { ...entry, role: nextRole, updatedAt: now }
        : entry
    ))
    return { memberships: normalized, created: false }
  }
  return {
    memberships: [...list, { userId, role, createdAt: now, updatedAt: now }],
    created: true,
  }
}

export function ensureWorkspaceMetadata(
  userId: string,
  entry: WorkspaceEntry,
  tenantId: string,
): { metadata: WorkspaceMetadata; created: boolean } {
  const dir = workspaceDir(userId, entry.id)
  const filesDir = path.join(dir, 'files')
  const artifactsDir = path.join(dir, 'artifacts')
  fs.mkdirSync(filesDir, { recursive: true })
  fs.mkdirSync(artifactsDir, { recursive: true })

  const existing = readJsonFile<WorkspaceMetadata>(workspaceMetaPath(userId, entry.id))
  const membership = ensureMembership(existing?.memberships, userId, 'owner')
  const now = new Date().toISOString()
  const metadata: WorkspaceMetadata = {
    id: entry.id,
    name: entry.name,
    ownerUserId: userId,
    tenantId: existing?.tenantId || tenantId,
    path: entry.path,
    isDefault: entry.isDefault ?? false,
    createdAt: existing?.createdAt || entry.createdAt || now,
    updatedAt: now,
    memberships: membership.memberships,
    storage: {
      rootDir: dir,
      filesDir,
      artifactsDir,
    },
  }
  writeJsonFile(workspaceMetaPath(userId, entry.id), metadata)
  return { metadata, created: !existing || membership.created }
}

function writeWorkspaceSession(userId: string, session: WorkspaceSessionRecord): void {
  writeJsonFile(workspaceSessionPath(userId), session)
}

function toBootstrapResult(
  userId: string,
  tenant: PersonalTenantRecord,
  workspace: WorkspaceEntry,
  metadata: WorkspaceMetadata,
  created: boolean,
): WorkspaceBootstrapResult {
  const membership = metadata.memberships.find((entry) => entry.userId === userId)
  const role = membership?.role || 'owner'
  writeWorkspaceSession(userId, {
    userId,
    tenant,
    tenantMemberships: [{ userId, role: 'owner', createdAt: tenant.createdAt, updatedAt: tenant.updatedAt }],
    workspaceMemberships: metadata.memberships,
    currentWorkspaceId: workspace.id,
    currentWorkspacePath: workspace.path,
    currentWorkspaceName: workspace.name,
    updatedAt: new Date().toISOString(),
  })
  return {
    currentUserId: userId,
    currentTenantId: tenant.id,
    currentWorkspaceId: workspace.id,
    currentWorkspacePath: workspace.path,
    currentWorkspaceName: workspace.name,
    role,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      path: workspace.path,
      isDefault: workspace.isDefault ?? false,
      tenantId: metadata.tenantId,
    },
    created,
  }
}

export function bootstrapWorkspaceForUser(userId: string): WorkspaceBootstrapResult {
  const { tenant, created: tenantCreated } = ensurePersonalTenant(userId)
  const { entry, created: workspaceCreated } = ensureDefaultWorkspaceEntry(userId)
  const { metadata, created: metadataCreated } = ensureWorkspaceMetadata(userId, entry, tenant.id)
  return toBootstrapResult(userId, tenant, entry, metadata, tenantCreated || workspaceCreated || metadataCreated)
}

function parseWorkspaceReference(
  userId: string,
  workspaceReference: string,
): { ownerUserId: string; workspaceId: string } | null {
  const trimmed = String(workspaceReference || '').trim()
  if (!trimmed) return null
  const parsed = parseClientPath(trimmed)
  if (parsed) {
    return { ownerUserId: parsed.userId, workspaceId: parsed.wsId }
  }
  return { ownerUserId: userId, workspaceId: trimmed }
}

export function assertWorkspaceAccess(
  userId: string,
  workspaceReference: string | null | undefined,
  requiredRole: WorkspaceRole = 'member',
): WorkspaceAccessResult {
  const bootstrap = bootstrapWorkspaceForUser(userId)
  const parsed = parseWorkspaceReference(userId, String(workspaceReference || '').trim())

  if (!parsed) {
    return {
      ...bootstrap,
      workspaceId: bootstrap.currentWorkspaceId,
      workspacePath: bootstrap.currentWorkspacePath,
      workspaceName: bootstrap.currentWorkspaceName,
    }
  }

  if (parsed.ownerUserId !== userId) {
    throw new WorkspaceAccessError('FORBIDDEN_WORKSPACE', '当前账号没有工作区权限，请联系管理员或重新初始化工作区。', 403, bootstrap)
  }

  const entry = listValidWorkspaces(userId).find((item) => item.id === parsed.workspaceId)
  if (!entry) {
    throw new WorkspaceAccessError('NO_WORKSPACE', '当前用户尚未拥有该工作区，已自动补齐默认工作区', 404, bootstrap)
  }

  const { metadata } = ensureWorkspaceMetadata(userId, entry, bootstrap.currentTenantId)
  const membership = metadata.memberships.find((item) => item.userId === userId)
  if (!membership) {
    throw new WorkspaceAccessError('NO_WORKSPACE', '当前用户尚未加入该工作区，已自动补齐默认工作区', 404, bootstrap)
  }

  if (ROLE_WEIGHT[membership.role] < ROLE_WEIGHT[requiredRole]) {
    throw new WorkspaceAccessError('INSUFFICIENT_ROLE', '当前账号没有工作区权限，请联系管理员或重新初始化工作区。', 403, bootstrap)
  }

  return {
    ...toBootstrapResult(userId, readJsonFile<PersonalTenantRecord>(tenantMetaPath(userId)) || {
      id: bootstrap.currentTenantId,
      ownerUserId: userId,
      type: 'personal',
      name: '个人租户',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, entry, metadata, false),
    workspaceId: entry.id,
    workspacePath: entry.path,
    workspaceName: entry.name,
  }
}

export function createWorkspaceForUser(userId: string, name: string): WorkspaceBootstrapResult {
  const bootstrap = bootstrapWorkspaceForUser(userId)
  const trimmedName = String(name || '').trim()
  const now = new Date().toISOString()
  const index = readIndex(userId)
  const existing = index.workspaces.find((entry) => entry.name === trimmedName)

  if (existing) {
    const { metadata } = ensureWorkspaceMetadata(userId, existing, bootstrap.currentTenantId)
    return toBootstrapResult(userId, readJsonFile<PersonalTenantRecord>(tenantMetaPath(userId)) || {
      id: bootstrap.currentTenantId,
      ownerUserId: userId,
      type: 'personal',
      name: '个人租户',
      createdAt: now,
      updatedAt: now,
    }, existing, metadata, false)
  }

  const workspaceId = randomUUID()
  const entry: WorkspaceEntry = {
    id: workspaceId,
    name: trimmedName || '工作区',
    path: clientPath(userId, workspaceId),
    createdAt: now,
    modifiedAt: now,
    isDefault: false,
  }
  index.workspaces.push(entry)
  writeIndex(userId, index)
  const { metadata } = ensureWorkspaceMetadata(userId, entry, bootstrap.currentTenantId)
  return toBootstrapResult(userId, readJsonFile<PersonalTenantRecord>(tenantMetaPath(userId)) || {
    id: bootstrap.currentTenantId,
    ownerUserId: userId,
    type: 'personal',
    name: '个人租户',
    createdAt: now,
    updatedAt: now,
  }, entry, metadata, true)
}
