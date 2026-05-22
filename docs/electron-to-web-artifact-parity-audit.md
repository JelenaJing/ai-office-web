# Electron to Web Artifact / Resource Center Parity Audit

## Source of truth

- `electron/main/services/workspaceService.ts`
- `electron/main/services/personalLibraryService.ts`
- `server/src/artifacts/ArtifactStore.ts`
- `server/src/routes/artifacts.ts`
- `ai-office-public-review/docs/web-migration-guide.md`
- `ai-office-public-review/electron/main/services/personalLibraryService.ts`

## Web status

**partial**

The Web server already stores generated outputs in `ArtifactStore` and exposes listing/download APIs. This phase adds preview, rename, and delete APIs so Resource Center can manage artifacts instead of only listing/downloading them.

## Web APIs

- `GET /api/artifacts`
- `GET /api/artifacts/:artifactId`
- `GET /api/artifacts/:artifactId/download`
- `GET /api/artifacts/:artifactId/preview`
- `PATCH /api/artifacts/:artifactId`
- `DELETE /api/artifacts/:artifactId`

## Remaining gaps

- Relationship browsing between Artifact and Matter / Email / Document / PPT is not complete.
- Preview is still limited to text/json/html/images; Office documents remain download-only.
- Artifact type schema is still permissive and not fully normalized across all modules.

## Migration confidence

High for basic CRUD/download ownership checks; medium for unified Resource Center parity.
