# Document P0 Closeout

## Current status

Document parity remains **partial**, but the P0 Web task contracts are now stricter and less likely to present incomplete Electron parity as success.

## Paper workflow closeout

### Source files

- `electron/main/services/paperGeneratorNFTCORE.ts`
- `electron/main/services/paperGenerator.ts`
- `electron/main/services/referenceManager.ts`
- `src/modules/paper/services/PaperService.ts`
- `server/src/features/document/services/paperNFTCORERuntime.ts`
- `server/src/features/document/routes/paperWorkflow.ts`

### Web APIs

- `POST /api/document/paper-workflow/start`
- `GET /api/document/paper-workflow/tasks/:taskId`
- `POST /api/document/paper-workflow/tasks/:taskId/cancel`

### P0 changes

- Paper task results now expose:
  - `references`
  - `outline`
  - `sections`
  - `referencesSidecar`
  - `citationStatus`
  - normalized `artifact`
- `citationStatus.verificationStatus` is explicitly `not-ported` until Electron `referenceManager` verification is moved server-side.
- `diagnostics.partialMissing` lists the remaining non-ported Electron gaps.
- Web UI shows `partial` status when the task returns known gaps.

### Remaining gaps

- incremental reference organisation pass
- knowledge tree check
- final full-paper review
- citation verification

## Formal template closeout

### Source files

- `electron/main/services/formalTemplate/formalTemplateTaskService.ts`
- `electron/main/services/formalTemplate/formalTemplateRoutingService.ts`
- `electron/main/services/formalTemplate/visitLetterSchemaStrategyService.ts`
- `electron/main/services/documentEngineService.ts`
- `src/modules/formal/hooks/useFormalTemplateGeneration.ts`

### Web APIs

- `POST /api/document/formal-template/start`
- `GET /api/document/formal-template/tasks/:taskId`
- `POST /api/document/formal-template/tasks/:taskId/cancel`

### Current P0 status

- Async formal-template task runtime exists.
- Template preset availability and unavailable reasons are exposed.
- Analyze / confirm / preview / commit semantics are represented in the Web task flow.
- Task result now exposes:
  - `previewMetadata`
  - `commitMetadata`
  - formal-template `artifact`
  - `diagnostics.partialMissing`
- `commitMetadata.docxCommitStatus` is explicitly `not-ported`.
- Web UI shows `partial` status when known OOXML / schema-first commit gaps remain.

### Remaining gaps

- OOXML block-level shell write-back
- header/footer fidelity
- schema-first base replace
- high-fidelity field extraction
- full commit-to-docx parity

## Validation

Run for each document closeout commit:

```bash
npm run check:boundaries
npm run build:web
cd server && npm run build
```
