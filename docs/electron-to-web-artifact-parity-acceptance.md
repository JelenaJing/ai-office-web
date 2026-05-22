# Electron to Web Artifact / Resource Center Parity Acceptance

## Acceptance checklist

- [ ] Current user's artifacts list through `GET /api/artifacts`.
- [ ] Artifact metadata loads through `GET /api/artifacts/:artifactId`.
- [ ] Download works through `GET /api/artifacts/:artifactId/download`.
- [ ] Text/json/html/image preview works through `GET /api/artifacts/:artifactId/preview`.
- [ ] Office formats return `previewStatus: "download-only"` instead of pretending preview exists.
- [ ] Rename works through `PATCH /api/artifacts/:artifactId`.
- [ ] Delete works through `DELETE /api/artifacts/:artifactId`.
- [ ] Ownership checks reject cross-user access.
- [ ] Resource-center client helpers exist for preview / rename / delete.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

Artifact CRUD basics are now available. Full relationship browsing and high-fidelity Office preview are still not complete.
