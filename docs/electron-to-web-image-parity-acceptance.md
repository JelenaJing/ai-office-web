# Electron to Web Image Parity Acceptance

## Acceptance checklist

- [ ] Web image generation starts through `POST /api/image/jobs/start`.
- [ ] Job status is available at `GET /api/image/jobs/:jobId`.
- [ ] Job cancellation is available at `POST /api/image/jobs/:jobId/cancel`.
- [ ] Completed job result contains an image Artifact.
- [ ] Frontend `ImageService.generateImage` polls the job API in Web mode.
- [ ] `partialMissing` lists reference-image, style/poster, and document/PPT insertion gaps.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

Text-to-image now uses the Web async job contract. Reference image workflows and high-level poster/style pipelines still need deeper migration.
