/**
 * modules/workspaces — User workspace lifecycle
 *
 * Responsibilities:
 *  - Create / get / delete workspaces per user
 *  - Enforce one "default" workspace per user
 *  - Validate workspace ownership on every request
 *  - Parse web-workspace client path tokens (web-workspace:{userId}:{wsId})
 *  - Future: workspace quotas (file count, total bytes) via quotas module
 *
 * Current implementation: see routes/workspaces.ts + lib/workspaceStore.ts
 * Migration target: this module replaces both once Prisma is wired.
 */

export {}
