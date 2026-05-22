# Latest Web Parity Smoke Report

- Started: 2026-05-22T17:20:03.402Z
- Finished: 2026-05-22T17:20:50.812Z
- Base URL: http://127.0.0.1:3001
- Modules: ppt
- Totals: passed 11, failed 0, skipped 0

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| ppt | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| ppt | `POST /api/ppt/decks/start (topic)` | taskId returned | HTTP 200 taskId=4e6941ea-00f2-405a-9854-5eb19ad8ffd7 | passed |  |
| ppt | `GET /api/ppt/decks/tasks/:taskId (topic)` | completed task with deckId and artifact relationship | status=completed deckId=04800f77-a847-4c7d-9020-9209a142e9b6 artifact=fb48a8d3-6ee5-4e58-b68d-3d7f5f71498b | passed |  |
| ppt | `GET /api/ppt/decks/04800f77-a847-4c7d-9020-9209a142e9b6` | DeckDocument has slides, template manifest, slide diagnostics | HTTP 200 slides=7 | passed |  |
| ppt | `GET /api/ppt/decks/04800f77-a847-4c7d-9020-9209a142e9b6/download` | download returns PPTX artifact/file | HTTP 200 bytes=74487 | passed |  |
| ppt | `POST /api/ppt/decks/04800f77-a847-4c7d-9020-9209a142e9b6/retemplate` | retemplate preview is zero-token | HTTP 200 tokenUsed=false | passed |  |
| ppt | `POST /api/aios/matters` | matter fixture created for Matter -> PPT | HTTP 201 matterId=783b8a3c-5f4a-476b-bad0-5459e627078b | passed |  |
| ppt | `POST /api/ppt/decks/start (matter)` | taskId returned | HTTP 200 taskId=c96c71f9-7f0c-4d8f-946f-25b8734c68bf | passed |  |
| ppt | `GET /api/ppt/decks/tasks/:taskId (matter)` | completed task with deckId and artifact relationship | status=completed deckId=5d8c0482-24e4-4f53-9e96-def9cc8d6a8b artifact=3cef93b3-bbaa-497d-a5d6-573b62d367b2 | passed |  |
| ppt | `src/bridges/document-to-ppt/convertDocumentToDeckInput` | document-to-ppt bridge returns deck input without importing PPT internals | sourceFeature=document slides=2 | passed |  |
