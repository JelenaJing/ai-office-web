# Latest Web Parity Smoke Report

- Started: 2026-05-22T17:14:36.000Z
- Finished: 2026-05-22T17:15:11.367Z
- Base URL: http://127.0.0.1:3001
- Modules: document
- Totals: passed 11, failed 0, skipped 1

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| document | `GET /api/workspaces/default` | default workspace path | workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| document | `POST /api/skills/web.document.generate/run` | normal document returns html/session or artifact | HTTP 200 | passed |  |
| document | `POST /api/document/paper-workflow/start (academic_paper)` | taskId returned | HTTP 200 taskId=37fceff4-b051-4f88-9006-0b200e6def1e | passed |  |
| document | `GET /api/document/paper-workflow/tasks/:taskId (academic_paper)` | completed structured paper result with artifactId/sourceRefs/exportRefs | status=completed paperType=research chain=paper-workflow-web-adapter artifactId=paper-mph6jmzq | passed |  |
| document | `POST /api/document/paper-workflow/start (literature_review)` | taskId returned | HTTP 200 taskId=0ed4e8f7-a887-48d4-8678-788927cd3bbb | passed |  |
| document | `GET /api/document/paper-workflow/tasks/:taskId (literature_review)` | completed structured paper result with artifactId/sourceRefs/exportRefs | status=completed paperType=review chain=paper-workflow-web-adapter artifactId=paper-mph6jwmw | passed |  |
| document | `POST /api/document/paper-workflow/tasks/:taskId/cancel` | cancelled status | HTTP 200 status=cancelled | passed |  |
| document | `POST /api/document/formal-template/start` | taskId returned | HTTP 200 taskId=9eeb0204-6323-44f3-bb5f-16d4dca343fa | passed |  |
| document | `GET /api/document/formal-template/tasks/:taskId` | completed formal template with analyze/confirm/preview/commit and artifact metadata | status=completed phases=analyze,confirm,preview,commit,completed artifactId=formal-template-mph6k55u | passed |  |
| document | `POST /api/skills/web.docx.export/run` | Word export returns docx artifact | HTTP 200 | passed |  |
| document | `POST /api/document/import-docx` | fixtures/test-duty.docx exists | fixture missing | skipped | Created docs/smoke/manual-fixtures-needed.md |
