# Electron to Web AIOS / Matter / OA Parity Audit

## Source of truth

- `server/src/features/aios/routes.ts`
- `server/src/features/aios/services/matterService.ts`
- `server/src/features/aios/services/decisionPackageService.ts`
- `server/src/features/aios/services/auditTrailService.ts`
- `src/features/aios/services/matterRuntime.ts`
- `src/communication/services/emailMatterBuilder.ts`

## Web status

**partial**

Web AIOS already supports Matter, Evidence, DecisionPackage, AuditTrail, Email → Matter, and Matter-generated Artifacts. This phase adds explicit parity status and audit replay endpoints, and aligns frontend auth token lookup with the unified Web token keys.

## Web APIs

- `GET /api/aios/parity-status`
- `GET /api/aios/matters`
- `POST /api/aios/matters`
- `GET /api/aios/matters/:id`
- `PATCH /api/aios/matters/:id`
- `DELETE /api/aios/matters/:id`
- `POST /api/aios/matters/from-email`
- `GET /api/aios/matters/:id/evidence`
- `POST /api/aios/matters/:id/evidence`
- `POST /api/aios/matters/:id/decision-package`
- `GET /api/aios/matters/:id/audit`
- `GET /api/aios/matters/:id/audit/replay`
- `POST /api/aios/matters/:id/generate-reply`
- `POST /api/aios/matters/:id/generate-document`
- `POST /api/aios/matters/:id/generate-ppt`

## Remaining gaps

- Approval workflow is not connected to an OA engine.
- Knowledge-base verification is partial.
- Audit replay is deterministic event listing, not full Electron replay.
- Cross-module Artifact relationship graph is partial.

## Migration confidence

Medium/high for Matter/Evidence/DecisionPackage/AuditTrail basics; low for OA approval and replay parity.
