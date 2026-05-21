# PostgreSQL / Prisma Database Schema Draft

## Motivation

Current state: all data is stored as JSON files on disk (`server/data/`).
This works for MVP but is not suitable for:
- Multi-instance horizontal scaling
- ACID transactions (e.g., quota check + artifact create)
- Efficient queries (list artifacts by user, audit log search)

## Approach

- **ORM**: Prisma 5 — type-safe, migration-based, supports PostgreSQL + SQLite dev mode
- **Database**: PostgreSQL 15 in production; SQLite for local dev/CI
- **Migration**: `prisma migrate dev` for local, `prisma migrate deploy` in CI/CD

## Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Users ────────────────────────────────────────────────────────────────────

model User {
  id           String      @id @default(uuid())
  email        String      @unique
  name         String?
  passwordHash String?     // null = SSO / AccountCenter users
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  workspaces   Workspace[]
  files        File[]
  artifacts    Artifact[]
  auditEvents  AuditEvent[]
  quota        Quota?
}

// ── Workspaces ───────────────────────────────────────────────────────────────

model Workspace {
  id        String   @id @default(uuid())
  userId    String
  name      String
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  files     File[]
  artifacts Artifact[]

  @@unique([userId, isDefault])   // only one default per user
  @@index([userId])
}

// ── Files ────────────────────────────────────────────────────────────────────

model File {
  id          String   @id @default(uuid())
  userId      String
  workspaceId String
  name        String
  ext         String
  mimeType    String
  size        Int
  storagePath String   // MinIO object key or local path
  uploadedAt  DateTime @default(now())
  deletedAt   DateTime?

  user        User      @relation(fields: [userId], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id])

  @@index([userId, workspaceId])
}

// ── Artifacts ────────────────────────────────────────────────────────────────

model Artifact {
  id          String   @id @default(uuid())
  userId      String
  workspaceId String
  skillId     String
  title       String
  type        String   // 'document' | 'presentation' | 'analysis'
  storagePath String   // MinIO object key or local path
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  deletedAt   DateTime?

  user        User      @relation(fields: [userId], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id])

  @@index([userId, workspaceId])
  @@index([skillId])
}

// ── Skill Jobs ───────────────────────────────────────────────────────────────

model SkillJob {
  id          String   @id @default(uuid())
  userId      String
  skillId     String
  status      String   // 'queued'|'running'|'done'|'failed'
  prompt      String
  params      Json     @default("{}")
  artifactId  String?
  error       String?
  queuedAt    DateTime @default(now())
  startedAt   DateTime?
  finishedAt  DateTime?

  @@index([userId, status])
}

// ── Audit Events ─────────────────────────────────────────────────────────────

model AuditEvent {
  id        String   @id @default(uuid())
  userId    String
  action    String   // 'login'|'logout'|'file.upload'|'file.delete'|'skill.run'|'artifact.download'
  resourceType String?
  resourceId   String?
  metadata  Json     @default("{}")
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([action, createdAt])
}

// ── Quotas ───────────────────────────────────────────────────────────────────

model Quota {
  id              String @id @default(uuid())
  userId          String @unique
  storageBytesMax BigInt @default(1073741824)  // 1 GB
  storageBytesCur BigInt @default(0)
  aiTokensPerDay  Int    @default(100000)
  aiTokensUsedToday Int  @default(0)
  quotaResetAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

## Migration Plan

1. Add Prisma to `server/package.json`
2. Start with SQLite in dev (`provider = "sqlite"`)
3. Write seed script for demo user
4. Migrate all route handlers to use `prisma.xxx` instead of JSON file I/O
5. Switch to PostgreSQL for staging/production

## Environment Variables

```
DATABASE_URL=postgresql://aios:secret@localhost:5432/aios_db
# Dev: DATABASE_URL=file:./dev.db
```
