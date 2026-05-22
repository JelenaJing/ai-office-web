# Electron to Web Communication / IM Parity Acceptance

## Acceptance checklist

- [ ] `GET /api/chat/rooms` returns available rooms.
- [ ] `GET /api/chat/rooms/:id/messages` returns messages for an accessible room.
- [ ] `POST /api/chat/rooms/:id/messages` appends a message.
- [ ] `POST /api/chat/rooms/:id/attachments` links an Artifact id as an attachment message.
- [ ] `GET /api/directory` returns current AccountCenter-backed directory status.
- [ ] Frontend runtime helpers exist for room/message operations.
- [ ] Responses include `partialMissing` for IM provider, directory, attachment, Matter, and report gaps.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

The API contract exists and is safe for Web callers. Full real-time IM/provider parity is not complete.
