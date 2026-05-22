# Electron to Web Email Parity Audit

## Source of truth

- `electron/main/services/emailService.ts`
- `electron/main/services/autoReplyService.ts`
- `electron/main/services/emailAttachmentOpenService.ts`
- `src/features/email/contexts/MailTriageContext.tsx`
- `src/features/email/services/mailTriageClassifier.ts`
- `src/features/email/services/bulkEmailDraftService.ts`
- `ai-office-public-review/src/communication/CommunicationWorkbench.tsx`
- `ai-office-public-review/src/communication/services/emailMatterBuilder.ts`
- `ai-office-public-review/src/communication/services/matterEvaluator.ts`

## Web status

**partial**

Web already has mailbox configuration, IMAP inbox fetch, message detail fetch, and SMTP send through `/api/email/*`. This phase adds an async unread triage task API so Web has a server-side `start/status/cancel` contract for AI mail整理.

## Implemented Web APIs

- `POST /api/email/triage/start`
- `GET /api/email/triage/tasks/:taskId`
- `POST /api/email/triage/tasks/:taskId/cancel`

## Current limitations

- Server triage currently uses deterministic classification and safe reply draft generation.
- The Electron/public-review LLM batch triage prompt is not yet fully ported server-side.
- Attachment-to-Artifact and attachment-open-to-document are still missing.
- Bulk recipient resolver, salutation generation, and dry-run bulk send are still missing.

## Migration confidence

Medium for the async task contract; low for full AI email parity until LLM batch classification and attachments are migrated.
