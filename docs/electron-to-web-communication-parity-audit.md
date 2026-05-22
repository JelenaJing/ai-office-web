# Electron to Web Communication / IM Parity Audit

## Source of truth

- `src/communication/CommunicationWorkbench.tsx`
- `src/communication/providers/MockChatProvider.ts`
- `src/features/email/components/CommunicationWorkbench.tsx`
- `ai-office-public-review/electron/main/services/userActionLogService.ts`
- `ai-office-public-review/electron/main/services/departmentService.ts`

## Web status

**partial**

The Web communication layer now has a server API for chat rooms, messages, attachment references, and directory lookup. It is intentionally marked partial because the actual Matrix/internal IM provider bridge and organization directory are not fully connected.

## Web APIs

- `GET /api/chat/rooms`
- `GET /api/chat/rooms/:id/messages`
- `POST /api/chat/rooms/:id/messages`
- `POST /api/chat/rooms/:id/attachments`
- `GET /api/directory`

## Remaining gaps

- Matrix / internal IM provider bridge is not fully ported.
- Attachments are linked by Artifact id only.
- Chat-to-Matter and chat-to-daily-report automation are partial.
- Organization directory provider and recipient resolver are partial.

## Migration confidence

Medium for API contract compatibility; low for full real-time IM parity until a provider bridge is connected.
