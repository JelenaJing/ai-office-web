# Electron to Web AIOS / Matter / OA Parity Acceptance

## Acceptance checklist

- [x] AIOS parity status is available through `GET /api/aios/parity-status`.
- [x] Matter CRUD works through `/api/aios/matters`.
- [x] Matter supports minimal `point_to_point` / `point_to_many` route types.
- [x] Email to Matter works through `POST /api/aios/matters/from-email`.
- [x] Evidence APIs work through `/api/aios/matters/:id/evidence`.
- [x] Evidence can carry attachment Artifact ids and knowledge verification status.
- [x] Decision package generation works through `POST /api/aios/matters/:id/decision-package`.
- [x] Decision packages include source references and knowledge verification status.
- [x] Audit trail works through `GET /api/aios/matters/:id/audit`.
- [x] Audit replay status is available through `GET /api/aios/matters/:id/audit/replay`.
- [x] Audit replay returns full event payloads.
- [x] Matter can generate reply/document/PPT Artifacts with `matterId` and source relationships.
- [x] Matter lifecycle supports `draft → collecting_evidence → decision_package_ready → completed`.
- [ ] Frontend Matter runtime uses unified Web token keys.
- [ ] Responses include `partialMissing` for OA approval, knowledge verification, replay, and relationship graph gaps.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts aios` passes.

## Current status

**partial**

Matter/Evidence/DecisionPackage/AuditTrail basics are available and now smoke-tested end-to-end through generated Artifacts and audit replay. OA approval remains pending, and knowledge verification is still partial.

## Deep E2E coverage

- Smoke creates a `draft` Matter with `point_to_many` route type.
- Adding email, attachment, and knowledge evidence moves the Matter to `collecting_evidence`.
- DecisionPackage generation moves the Matter to `decision_package_ready` and returns `sourceReferences` plus `knowledgeVerificationStatus`.
- Reply, document, and PPT generation return Artifacts that carry `matterId`, `sourceRefs`, and relationship graph entries.
- Audit and audit replay include lifecycle, evidence, decision package, and generation events.
- Smoke completes the Matter lifecycle with `PATCH /api/aios/matters/:id`.
