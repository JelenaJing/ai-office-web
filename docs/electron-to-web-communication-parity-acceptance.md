# Electron to Web Communication / IM Parity Acceptance

## Acceptance checklist

- [x] `GET /api/chat/rooms` returns available rooms.
- [x] `GET /api/chat/rooms/:id/messages` returns messages for an accessible room.
- [x] `POST /api/chat/rooms/:id/messages` appends a message.
- [ ] `POST /api/chat/rooms/:id/attachments` links an Artifact id as an attachment message.
- [x] `POST /api/chat/rooms/:id/matter` creates a real Matter with chat evidence.
- [x] `GET /api/directory` returns current AccountCenter-backed directory status.
- [ ] Frontend runtime helpers exist for room/message operations.
- [x] Responses include `partialMissing` for IM provider, directory, attachment, Matter, and report gaps.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts communication` passes.

## Current status

**partial**

The API contract exists and is safe for Web callers. Full real-time IM/provider parity is not complete.

## Deep E2E coverage

- Smoke lists rooms, sends a message, and confirms message listing.
- Smoke checks directory partial provider status.
- Chat-to-Matter now creates an AIOS Matter with recent chat evidence.
