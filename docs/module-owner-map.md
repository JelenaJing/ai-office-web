# Module Owner Map

> This document maps each module to its owner(s), responsibilities, and boundaries.
> Update this file when ownership changes or new modules are added.

---

## Feature Modules

### `document` — 文稿模块

| Field | Value |
|-------|-------|
| Owner | document-team |
| Location | `src/features/document/`, `server/src/features/document/` |
| Public API | `src/features/document/index.ts` |
| Manifest | `src/features/document/manifest.ts` |
| Server routes | `server/src/routes/document.ts` (→ `server/src/features/document/`) |
| Key skills | `web.docx.create`, `web.docx.export`, `web.markdown.export` |
| Bridge producer | `document-to-ppt` |
| Must NOT import | `src/features/ppt/**`, `src/features/email/**` |

---

### `ppt` — PPT 模块

| Field | Value |
|-------|-------|
| Owner | ppt-team |
| Location | `src/features/ppt/`, `server/src/features/ppt/` |
| Public API | `src/features/ppt/index.ts` |
| Manifest | `src/features/ppt/manifest.ts` |
| Server routes | `server/src/routes/ppt.ts` (→ `server/src/features/ppt/`) |
| Key skills | `web.pptx.create` |
| Bridge consumer | `document-to-ppt` |
| Must NOT import | `src/features/document/**`, `src/features/email/**` |

---

### `email` — 邮件模块

| Field | Value |
|-------|-------|
| Owner | email-team |
| Location | `src/features/email/`, `server/src/features/email/` |
| Public API | `src/features/email/index.ts` |
| Manifest | `src/features/email/manifest.ts` |
| Server routes | `server/src/routes/email.ts` |
| Key features | IMAP/SMTP, 收件箱, 发件, 邮件→事项 |
| Bridge consumer | (none currently) |
| Must NOT import | `src/features/document/**`, `src/features/ppt/**` |

---

### `aios` — AIOS 事项模块

| Field | Value |
|-------|-------|
| Owner | aios-team |
| Location | `src/features/aios/`, `server/src/features/aios/` |
| Public API | `src/features/aios/index.ts` |
| Manifest | `src/features/aios/manifest.ts` |
| Server routes | `/api/aios/**` via `server/src/features/aios/routes.ts` |
| Key features | Matter CRUD, Evidence, DecisionPackage, AuditTrail, 生成回复/文稿/PPT |
| Bridge consumer | (uses generation services, not bridges yet) |
| Must NOT import | `src/features/document/components/**`, `src/features/ppt/components/**` |

---

## Core Modules

### `core` — 核心合约

| Field | Value |
|-------|-------|
| Owner | architecture-team |
| Location | `src/core/contracts/` |
| Contains | Shared TypeScript types only (no runtime code) |
| Key types | `FeatureManifest`, `DocumentOutline`, `DeckGenerationInput`, `ArtifactRef` |
| May import | Nothing from `src/` |
| May be imported by | All feature modules, bridges, app shell |

---

### `platform` — 平台 API

| Field | Value |
|-------|-------|
| Owner | platform-team |
| Location | `src/platform/` |
| Contains | `platformApi`, feature gates, environment detection |
| Key exports | `platformApi`, `isWebShim()`, `isWebFeatureEnabled()` |
| May import | Nothing from `src/features/` |
| May be imported by | All feature modules |

---

## Bridge Modules

### `document-to-ppt` — 文稿转 PPT

| Field | Value |
|-------|-------|
| Owner | architecture-team (shared between document-team and ppt-team) |
| Location | `src/bridges/document-to-ppt/` |
| Purpose | Converts `DocumentOutline` → `DeckGenerationInput` |
| Imports | `src/core/contracts/` types only |
| Must NOT import | Feature internals (components, services, hooks) |
| Versioning | `BRIDGE_VERSION` in `index.ts` |

---

## App Shell

### `app` — 应用壳

| Field | Value |
|-------|-------|
| Owner | platform-team |
| Location | `src/App.tsx`, `src/app/featureRegistry.ts`, `src/pages/` |
| Purpose | Route orchestration, feature registry, nav shell |
| May import from features | `manifest.ts` and `index.ts` only |
| Must NOT import | Feature component internals |

---

## Boundary Enforcement

Run `npm run check:boundaries` to verify no cross-feature internal imports exist.

See `docs/module-boundary-guide.md` for detailed rules.
