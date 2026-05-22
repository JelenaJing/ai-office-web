# Electron to Web Knowledge Parity Acceptance

## Acceptance checklist

- [x] Knowledge base info loads through `GET /api/knowledge/:departmentId/info`.
- [x] Documents list through `GET /api/knowledge/:departmentId/documents`.
- [x] Upload uses browser multipart and `POST /api/knowledge/:departmentId/import`; remote failures are reported as partial instead of success.
- [x] Delete uses `DELETE /api/knowledge/:departmentId/documents/:documentId` when import returns a document id.
- [x] Parity status is visible at `GET /api/knowledge/:departmentId/parity-status`.
- [x] Parity status returns `status: "partial"` when citation/permission/vector guarantees are not complete.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts artifact-knowledge` passes.

## Current status

**partial**

The Web knowledge module exposes the remote-service backed upload/list/delete path and a transparent parity status. It does not claim full Electron RAG parity yet.

## Deep E2E coverage

- Smoke verifies `parity-status` and document list for `scientific-papers`.
- Smoke attempts multipart import and records remote-service failure as skipped/partial, not as a fake success.
- Delete is executed only when import returns a concrete document id.
- Artifact relationship metadata can now carry `knowledgeRefs` with citation status for downstream generated outputs.

## Known missing

- Verified end-to-end vector search in document/PPT/email generation.
- Citation source propagation into generated outputs.
- Fine-grained owner/trust/effective-time permissions.
