# Electron to Web Knowledge Parity Acceptance

## Acceptance checklist

- [ ] Knowledge base info loads through `GET /api/knowledge/:departmentId/info`.
- [ ] Documents list through `GET /api/knowledge/:departmentId/documents`.
- [ ] Upload uses browser multipart and `POST /api/knowledge/:departmentId/import`.
- [ ] Delete uses `DELETE /api/knowledge/:departmentId/documents/:documentId`.
- [ ] Parity status is visible at `GET /api/knowledge/:departmentId/parity-status`.
- [ ] Parity status returns `status: "partial"` when citation/permission/vector guarantees are not complete.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

The Web knowledge module exposes the remote-service backed upload/list/delete path and a transparent parity status. It does not claim full Electron RAG parity yet.

## Known missing

- Verified end-to-end vector search in document/PPT/email generation.
- Citation source propagation into generated outputs.
- Fine-grained owner/trust/effective-time permissions.
