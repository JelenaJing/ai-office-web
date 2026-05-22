# Electron to Web Knowledge Parity Audit

## Source of truth

- `electron/main/services/knowledgeService.ts`
- `electron/main/services/knowledgeRetrievalService.ts`
- `server/src/features/knowledge/services/remoteKnowledgeClient.ts`
- `ai-office-public-review/electron/main/services/knowledgeService.ts`
- `ai-office-public-review/electron/main/services/knowledgeRetrievalService.ts`

## Web status

**partial**

Web knowledge upload/list/delete already goes through `/api/knowledge/:departmentId/*` and the remote knowledge service client. This phase adds an explicit parity-status endpoint so callers can see whether upload, extraction, chunking, embedding/vector search, citation source display, and permissions are actually available.

## Web APIs

- `GET /api/knowledge/:departmentId/info`
- `GET /api/knowledge/:departmentId/documents`
- `POST /api/knowledge/:departmentId/import`
- `DELETE /api/knowledge/:departmentId/documents/:documentId`
- `GET /api/knowledge/:departmentId/parity-status`

## Remaining gaps

- Local Electron `knowledgeService` parity is not fully ported.
- Citation source propagation across document / PPT / email remains partial.
- Trust level, effective time, owner metadata, and fine-grained permissions are not fully exposed.

## Migration confidence

Medium for upload/list/delete; low for full RAG/citation parity until vector search and source attribution are verified end to end.
