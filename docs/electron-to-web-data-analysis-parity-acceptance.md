# Electron to Web Data Analysis Parity Acceptance

## Acceptance checklist

- [ ] Analysis starts through `POST /api/data-analysis/jobs/start`.
- [ ] Job status is available through `GET /api/data-analysis/jobs/:jobId`.
- [ ] Job cancellation is available through `POST /api/data-analysis/jobs/:jobId/cancel`.
- [ ] Job artifacts are available through `GET /api/data-analysis/jobs/:jobId/artifacts`.
- [ ] Frontend `platformApi.excel.analyze` polls the Web job API.
- [ ] Completed job returns an `excel_analysis` Artifact.
- [ ] `partialMissing` lists Python/chart/result-parser parity gaps.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

Web xlsx/csv analysis is async and Artifact-backed. Full Electron Python and chart generation parity is still pending.
