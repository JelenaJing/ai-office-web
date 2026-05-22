# Electron to Web Email Parity Acceptance

## Acceptance checklist

- [x] Mailbox configuration still works through `/api/email/account`; `/api/email/accounts` reports setup status for smoke.
- [x] IMAP inbox fetch still works through `/api/email/messages`.
- [ ] SMTP send still works through `/api/email/send`.
- [x] Unread triage starts with `POST /api/email/triage/start`.
- [x] Triage task status is available at `GET /api/email/triage/tasks/:taskId`.
- [ ] Triage task cancellation is available at `POST /api/email/triage/tasks/:taskId/cancel`.
- [x] Completed triage results include category, priority, urgency, summary, risk level, tasks, reply draft where safe, unread-only guard, and cache key.
- [x] Reply drafts can be saved as `email_draft` Artifacts.
- [x] Email attachments can be saved as Artifacts, including a real IMAP attachment path when messages include attachments.
- [x] Email can convert to Matter and generate document/PPT Artifacts through existing AIOS workflow APIs.
- [x] Dry-run recipient resolver returns personalized salutations without sending.
- [x] Result `partialMissing` explicitly lists non-ported LLM batch triage and manual-approval bulk send gap.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts email` passes.

## Current status

**partial**

The Deep E2E phase runs account discovery, IMAP inbox fetch, unread-only triage, reply draft Artifact creation, attachment Artifact creation, email → Matter, and Matter → document/PPT Artifact generation. It does not claim full Electron/public-review mail AI parity.

## Deep E2E coverage

- `/api/email/accounts` reports whether manual IMAP/SMTP setup is needed and lets smoke skip live mailbox checks without failing the whole pipeline.
- `/api/email/triage/start` accepts `workspacePath`; completed tasks expose `unreadOnly`, `cacheKey`, `sourceMessageCount`, draft relationships, and attachment conversion status.
- `/api/email/drafts/artifact` stores reply drafts as `email_draft` Artifacts.
- `/api/email/attachments/artifacts` stores attachment payloads as Artifacts with email relationships; `/api/email/messages/:id/attachments/:attachmentId/artifact` stores real IMAP attachments when present.
- `/api/email/drafts/dry-run` resolves recipients and salutations without sending.
- `/api/aios/matters/from-email` plus AIOS generate-document/generate-ppt are smoke-tested as the mail-to-workflow handoff.

## Known missing

- Full LLM batch triage prompt parity.
- Bulk send execution remains manual-approval only.
- Full attachment open-to-document/editor workflow and high-fidelity preview remain partial; Artifact ingestion is now covered.
- Calendar deeper integration remains partial.
