# Electron to Web Data Analysis Parity Acceptance

## Acceptance checklist

- [x] Analysis starts through `POST /api/data-analysis/jobs/start`.
- [x] Job status is available through `GET /api/data-analysis/jobs/:jobId`.
- [ ] Job cancellation is available through `POST /api/data-analysis/jobs/:jobId/cancel`.
- [x] Job artifacts are available through `GET /api/data-analysis/jobs/:jobId/artifacts`.
- [ ] Frontend `platformApi.excel.analyze` polls the Web job API.
- [x] Completed job returns an `excel_analysis` Artifact.
- [x] Analysis Artifact carries source file relationship metadata.
- [x] `partialMissing` lists Python/chart/result-parser parity gaps.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts data-analysis` passes.

## Current status

**partial**

Web xlsx/csv analysis is async and Artifact-backed. Full Electron Python and chart generation parity is still pending.

## Deep E2E coverage

- Smoke uploads a CSV fixture through `/api/files/upload`.
- Smoke starts analysis, polls completion, fetches job artifacts, previews the Markdown report, and verifies the source file relationship.
- Chart image Artifact generation and Python runtime parity remain explicit partials.
