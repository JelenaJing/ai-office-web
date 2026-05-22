# Electron to Web Email Parity Acceptance

## Acceptance checklist

- [ ] Mailbox configuration still works through `/api/email/account`.
- [ ] IMAP inbox fetch still works through `/api/email/messages`.
- [ ] SMTP send still works through `/api/email/send`.
- [ ] Unread triage starts with `POST /api/email/triage/start`.
- [ ] Triage task status is available at `GET /api/email/triage/tasks/:taskId`.
- [ ] Triage task cancellation is available at `POST /api/email/triage/tasks/:taskId/cancel`.
- [ ] Completed triage results include category, priority, urgency, summary, risk level, tasks, and reply draft where safe.
- [ ] Result `partialMissing` explicitly lists non-ported LLM batch triage and attachment gaps.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

This phase adds the Web async triage runtime contract and safe deterministic classification. It does not claim full Electron/public-review mail AI parity.

## Known missing

- Full LLM batch triage prompt parity.
- Attachment download/open-to-document/Artifact pipeline.
- Bulk email dry-run and personalized salutation generation.
- Email to PPT / Calendar deeper integration.
