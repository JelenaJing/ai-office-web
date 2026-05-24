# Latest Web Parity Smoke Report

- Started: 2026-05-23T07:57:33.359Z
- Finished: 2026-05-23T07:58:29.110Z
- Base URL: http://127.0.0.1:3001
- Modules: email
- Totals: passed 13, failed 0, skipped 0

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| email | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| email | `GET /api/email/accounts` | account list endpoint reports configuration status | HTTP 200 configured=true | passed |  |
| email | `POST /api/email/drafts/dry-run` | dry-run recipient resolver returns salutations without sending | HTTP 200 recipients=2 | passed |  |
| email | `POST /api/email/drafts/artifact` | reply draft is saved as email_draft Artifact | HTTP 200 artifact=f61662c0-b864-4c98-a689-df3682f038ba | passed |  |
| email | `POST /api/email/attachments/artifacts` | attachment payload is saved as Artifact with email relationship | HTTP 200 artifacts=1 | passed |  |
| email | `POST /api/aios/matters/from-email` | email converts to Matter | HTTP 201 matterId=ce11cbe5-a334-407c-a027-bde38b53b2c2 | passed |  |
| email | `POST /api/aios/matters/ce11cbe5-a334-407c-a027-bde38b53b2c2/generate-document` | mail Matter can generate document Artifact | HTTP 200 artifact=58422751-3d9b-424e-bea1-3a532dd15a75 | passed |  |
| email | `POST /api/aios/matters/ce11cbe5-a334-407c-a027-bde38b53b2c2/generate-ppt` | mail Matter can generate PPT Artifact | HTTP 200 artifact=8181b64e-2dca-41cb-af64-88413d4abe07 | passed |  |
| email | `GET /api/email/messages?folder=inbox` | inbox fetch succeeds when account is configured | HTTP 200 messages=30 | passed |  |
| email | `POST /api/email/triage/start` | triage task starts for unread-only messages | HTTP 200 taskId=0b4f68a8-9c0a-4d78-b9f7-561cb395dec1 | passed |  |
| email | `GET /api/email/triage/tasks/:taskId` | completed triage with categories, summaries, priorities, draft relationships, unread guard, and cache key | status=completed results=10 cacheKey=email-triage:1779523096220 | passed |  |
| email | `POST /api/email/messages/828/attachments/0/artifact` | real email attachment converts to Artifact | HTTP 200 artifact=7b8afcd4-05b9-4f4c-8881-f59955f03552 | passed |  |
