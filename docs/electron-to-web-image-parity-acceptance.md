# Electron to Web Image Parity Acceptance

## Acceptance checklist

- [x] Web image generation starts through `POST /api/image/jobs/start`.
- [x] Job status is available at `GET /api/image/jobs/:jobId`.
- [x] Job cancellation is available at `POST /api/image/jobs/:jobId/cancel`.
- [ ] Completed job result contains an image Artifact when the image provider succeeds.
- [ ] Frontend `ImageService.generateImage` polls the job API in Web mode.
- [x] Provider failures are explicit partial/skipped smoke results, not fake successful Artifacts.
- [x] `partialMissing` lists reference-image, style/poster, and document/PPT insertion gaps.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts image` passes with provider partial/skipped when the upstream image service fails.

## Current status

**partial**

Text-to-image now uses the Web async job contract. Reference image workflows and high-level poster/style pipelines still need deeper migration.

## Deep E2E coverage

- Smoke starts an image job and polls status.
- If the configured provider returns an error, smoke records it as explicit partial/skipped instead of treating it as an image Artifact.
- Smoke verifies job cancellation.
- Successful image Artifacts now carry prompt `sourceRefs`.
