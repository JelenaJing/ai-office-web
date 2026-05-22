# Latest Web Parity Smoke Report

- Started: 2026-05-22T17:27:21.018Z
- Finished: 2026-05-22T17:27:54.086Z
- Base URL: http://127.0.0.1:3001
- Modules: email
- Totals: passed 13, failed 0, skipped 0

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| email | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| email | `GET /api/email/accounts` | account list endpoint reports configuration status | HTTP 200 configured=true | passed |  |
| email | `POST /api/email/drafts/dry-run` | dry-run recipient resolver returns salutations without sending | HTTP 200 recipients=2 | passed |  |
| email | `POST /api/email/drafts/artifact` | reply draft is saved as email_draft Artifact | HTTP 200 artifact=97cfa3fc-f6f7-4473-8089-843b556011ee | passed |  |
| email | `POST /api/email/attachments/artifacts` | attachment payload is saved as Artifact with email relationship | HTTP 200 artifacts=1 | passed |  |
| email | `POST /api/aios/matters/from-email` | email converts to Matter | HTTP 201 matterId=4e9d0916-d520-4b66-860e-0fde2caf9185 | passed |  |
| email | `POST /api/aios/matters/4e9d0916-d520-4b66-860e-0fde2caf9185/generate-document` | mail Matter can generate document Artifact | HTTP 200 artifact=3f341f29-2315-4a3a-94bf-57108bc30e22 | passed |  |
| email | `POST /api/aios/matters/4e9d0916-d520-4b66-860e-0fde2caf9185/generate-ppt` | mail Matter can generate PPT Artifact | HTTP 200 artifact=67e3b156-b551-4bb4-9a6f-7509018d9899 | passed |  |
| email | `GET /api/email/messages?folder=inbox` | inbox fetch succeeds when account is configured | HTTP 200 messages=30 | passed |  |
| email | `POST /api/email/triage/start` | triage task starts for unread-only messages | HTTP 200 taskId=a008317d-395f-4c6c-bc85-07ab5554f782 | passed |  |
| email | `GET /api/email/triage/tasks/:taskId` | completed triage with categories, summaries, priorities, draft relationships, unread guard, and cache key | status=completed results=10 cacheKey=email-triage:1779470862582 | passed |  |
| email | `POST /api/email/messages/828/attachments/0/artifact` | real email attachment converts to Artifact | HTTP 200 artifact=4ab8483a-18cc-4b3f-b767-fb53da0e8ace | passed |  |
