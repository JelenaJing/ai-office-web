# Electron to Web Image Parity Audit

## Source of truth

- `electron/main/services/imageClient.ts`
- `server/src/features/image/services/imageGenerator.ts`
- `server/src/features/image/skills/createImageSkill.ts`
- `src/features/image/services/ImageService.ts`
- `ai-office-public-review/electron/main/services/imageClient.ts`

## Web status

**partial**

This phase adds the required async image job contract and moves the Web image generation service from direct skill execution to `/api/image/jobs/*`.

## Web APIs

- `POST /api/image/jobs/start`
- `GET /api/image/jobs/:jobId`
- `POST /api/image/jobs/:jobId/cancel`

## Remaining gaps

- Reference image generation is not yet ported to the Web job API.
- Style controls and poster workflow remain partial.
- Inserting generated images into document/PPT is not fully wired.

## Migration confidence

High for text-to-image job contract and Artifact output; medium/low for full Electron image parity.
