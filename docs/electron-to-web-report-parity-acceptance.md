# Electron to Web Daily Report Parity Acceptance

## Acceptance checklist

- [x] Activity event ingestion works through `POST /api/work-report/events`.
- [x] Personal daily report works through `GET /api/work-report/daily`.
- [x] Daily report returns a `report` Artifact.
- [ ] Frontend `WebDailyReportPanel` calls `/api/work-report/daily`.
- [x] Subordinate listing route exists and clearly returns partial status.
- [x] Summary route exists and clearly returns partial status.
- [x] Daily report includes Matter / Artifact / email events from smoke.
- [x] `partialMissing` lists role/org and durable activity ingestion gaps.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts report` passes.

## Current status

**partial**

Personal Web daily reports are functional and Artifact-backed. Supervisor/admin parity remains partial until org and role integrations are connected.

## Deep E2E coverage

- Smoke creates Matter and Artifact fixtures.
- Smoke writes Matter, Artifact, and email work-report events.
- Daily report returns an Artifact and includes all three event modules.
- Summary and subordinates endpoints return deterministic partial responses.
