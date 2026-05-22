# Electron to Web Skill Runtime / Store Parity Acceptance

## Acceptance checklist

- [x] Built-in skills list through `GET /api/skills`.
- [x] Built-in sync execution remains available through `POST /api/skills/:skillId/run`.
- [x] Skill Center status is available through `GET /api/skill-center/status`.
- [x] Selected built-in Skill jobs start through `POST /api/skill-center/jobs/start`.
- [x] Skill job status is available through `GET /api/skill-center/jobs/:jobId`.
- [ ] Skill job cancel is available through `POST /api/skill-center/jobs/:jobId/cancel`.
- [ ] Frontend Skill Center runtime helpers exist.
- [x] Skill results return Artifact or explicit no-artifact/error reason.
- [x] Responses include `partialMissing` for remote store and AOSKIN gaps.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts skill` passes.

## Current status

**partial**

Web built-in skills are available; remote store installation and generalized AOSKIN execution remain pending.

## Deep E2E coverage

- Smoke verifies the built-in skill list contains `web.daily.report`.
- Smoke runs `web.daily.report` through `/api/skills/:skillId/run` and receives a report Artifact.
- Smoke starts and polls a selected built-in Skill Center job and receives an Artifact.
- Skill Center status keeps AOSKIN and remote store gaps explicit.
