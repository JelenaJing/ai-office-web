# Electron to Web AIOS / Matter / OA Parity Acceptance

## Acceptance checklist

- [ ] AIOS parity status is available through `GET /api/aios/parity-status`.
- [ ] Matter CRUD works through `/api/aios/matters`.
- [ ] Email to Matter works through `POST /api/aios/matters/from-email`.
- [ ] Evidence APIs work through `/api/aios/matters/:id/evidence`.
- [ ] Decision package generation works through `POST /api/aios/matters/:id/decision-package`.
- [ ] Audit trail works through `GET /api/aios/matters/:id/audit`.
- [ ] Audit replay status is available through `GET /api/aios/matters/:id/audit/replay`.
- [ ] Matter can generate reply/document/PPT Artifacts.
- [ ] Frontend Matter runtime uses unified Web token keys.
- [ ] Responses include `partialMissing` for OA approval, knowledge verification, replay, and relationship graph gaps.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

Matter/Evidence/DecisionPackage/AuditTrail basics are available. OA approval and full audit replay parity remain pending.
