# Electron to Web Daily Report Parity Acceptance

## Acceptance checklist

- [ ] Activity event ingestion works through `POST /api/work-report/events`.
- [ ] Personal daily report works through `GET /api/work-report/daily`.
- [ ] Daily report returns a `report` Artifact.
- [ ] Frontend `WebDailyReportPanel` calls `/api/work-report/daily`.
- [ ] Subordinate listing route exists and clearly returns partial status.
- [ ] Summary route exists and clearly returns partial status.
- [ ] `partialMissing` lists role/org and durable activity ingestion gaps.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

Personal Web daily reports are functional and Artifact-backed. Supervisor/admin parity remains partial until org and role integrations are connected.
