# Final Web Parity E2E Smoke Report

## Summary

- Command: `npx tsx scripts/smoke/run-web-parity-smoke.ts all`
- Started: 2026-05-22T17:43:59.092Z
- Finished: 2026-05-22T17:47:12.140Z
- Result: 97 passed, 0 failed, 4 skipped
- Required checks before final smoke: `npm run check:boundaries`, `npm run build:web`, and `cd server && npm run build` passed.

## Module results

| Module | Passed | Failed | Skipped | Notes |
| --- | ---: | ---: | ---: | --- |
| Auth | 1 | 0 | 0 | Login token acquired for protected route smoke. |
| Document | 10 | 0 | 1 | Paper, literature review, cancel, formal template, and Word export passed; DOCX import fixture missing. |
| PPT | 10 | 0 | 0 | Deck generation, download, zero-token retemplate, Matter input, and document-to-PPT bridge passed. |
| Email | 12 | 0 | 0 | Account discovery, draft Artifact, attachment Artifact, triage, email-to-Matter, and Matter-to-document/PPT passed. |
| Artifact / Knowledge | 10 | 0 | 2 | Artifact CRUD/preview/relationships passed; Knowledge import/delete skipped on remote-service partial. |
| AIOS | 18 | 0 | 0 | Matter lifecycle, evidence, DecisionPackage, audit replay, and generated Artifacts passed. |
| Image | 4 | 0 | 1 | Start/status/cancel route passed; provider returned explicit 404 partial. |
| Data analysis | 7 | 0 | 0 | CSV upload, analysis job, Markdown Artifact, preview, and source refs passed. |
| Report | 9 | 0 | 0 | Matter/Artifact/email events entered daily report and produced report Artifact. |
| Communication | 6 | 0 | 0 | Rooms/messages, directory, and chat-to-Matter evidence handoff passed. |
| Skill Center | 6 | 0 | 0 | Built-in list/run and selected async job produced Artifacts. |
| Settings | 4 | 0 | 0 | Auth/me, masked AI settings, AI test, and parity status passed without key leakage. |

## Explicit partial skips

| Module | Endpoint | Reason |
| --- | --- | --- |
| Document | `POST /api/document/import-docx` | `fixtures/test-duty.docx` is not present; `docs/smoke/manual-fixtures-needed.md` documents the needed manual fixture. |
| Artifact / Knowledge | `POST /api/knowledge/scientific-papers/import` | Remote Knowledge import returned HTTP 502 and was recorded as partial. |
| Artifact / Knowledge | `DELETE /api/knowledge/scientific-papers/documents/:documentId` | Import returned no test document id, so delete was skipped. |
| Image | `GET /api/image/jobs/:jobId` | Upstream image provider returned `图片生成失败 (404)：`; no fake image Artifact was claimed. |

## Demo readiness

The Web build is demoable for the main E2E paths that passed smoke: document paper/formal template task contracts, PPT generation/download/retemplate, email triage/draft/attachment/Matter handoff, AIOS Matter/DecisionPackage/Artifact/audit, Artifact CRUD/relationships, data analysis report Artifact, daily report, communication chat-to-Matter, Skill Center selected jobs, and settings masking.

Do not demo the remaining high-fidelity claims as full parity: Word OOXML fidelity, PPT full layout matching/import, RAG/vector search, Matrix/internal IM provider, Python/chart execution, remote Skill Store/AOSKIN, and image generation until the configured provider succeeds.
