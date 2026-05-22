# Electron to Web Data Analysis Parity Audit

## Source of truth

- `electron/main/services/workspaceActivityService.ts`
- `server/src/features/data-analysis/services/excelAnalyzer.ts`
- `server/src/features/data-analysis/skills/analyzeXlsxSkill.ts`
- `src/features/data-analysis/components/ExcelAnalysisWorkbench.tsx`
- `ai-office-public-review/electron/main/services/workspaceActivityService.ts`

## Web status

**partial**

The Web table analysis flow now uses a server-side async job contract. Existing xlsx/csv structural analysis still produces a Markdown Artifact, while known Electron Python/chart/result parser gaps are surfaced as `partialMissing`.

## Web APIs

- `POST /api/data-analysis/jobs/start`
- `GET /api/data-analysis/jobs/:jobId`
- `POST /api/data-analysis/jobs/:jobId/cancel`
- `GET /api/data-analysis/jobs/:jobId/artifacts`

## Remaining gaps

- Python execution environment probing and dependency management are not fully ported.
- Chart images are not emitted as separate Artifacts.
- Electron stdout/result JSON parser parity remains partial.
- Advanced data model selection is captured as options but not equivalent to the Electron runner.

## Migration confidence

High for xlsx/csv upload analysis and Markdown Artifact output; medium/low for Python/chart parity.
