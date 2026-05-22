# Electron to Web Artifact / Resource Center Parity Acceptance

## Acceptance checklist

- [x] Current user's artifacts list through `GET /api/artifacts`.
- [x] Artifact creation works through `POST /api/artifacts` for smoke/manual Artifact ingestion.
- [x] Artifact metadata loads through `GET /api/artifacts/:artifactId`.
- [x] Artifact relationship graph loads through `GET /api/artifacts/:artifactId/relationships`.
- [x] Download works through `GET /api/artifacts/:artifactId/download`.
- [x] Text/json/html/image preview works through `GET /api/artifacts/:artifactId/preview`.
- [x] Office formats return `previewStatus: "download-only"` instead of pretending preview exists.
- [x] Rename works through `PATCH /api/artifacts/:artifactId`.
- [x] Delete works through `DELETE /api/artifacts/:artifactId`.
- [ ] Ownership checks reject cross-user access.
- [ ] Resource-center client helpers exist for preview / rename / delete.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts artifact-knowledge` passes.

## Current status

**partial**

Artifact CRUD basics and relationship metadata are now available. High-fidelity Office preview and complete graph UI browsing are still not complete.

## Deep E2E coverage

- Smoke creates a document Artifact with `sourceRefs`, `knowledgeRefs`, `matterId`, `emailId`, `deckId`, and `documentId`.
- Detail and relationship graph endpoints expose source and knowledge edges.
- Preview, rename, download, and delete are exercised on the created Artifact.
- `saveSkillArtifact` now accepts optional source, knowledge, matter, email, deck, and document relationship metadata so module outputs can preserve traceability.
