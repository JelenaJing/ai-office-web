# Latest Web Parity Smoke Report

- Started: 2026-05-22T17:43:59.092Z
- Finished: 2026-05-22T17:47:12.140Z
- Base URL: http://127.0.0.1:3001
- Modules: document, ppt, email, artifact-knowledge, aios, image, data-analysis, report, communication, skill, settings
- Totals: passed 97, failed 0, skipped 4

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| document | `GET /api/workspaces/default` | default workspace path | workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| document | `POST /api/skills/web.document.generate/run` | normal document returns html/session or artifact | HTTP 200 | passed |  |
| document | `POST /api/document/paper-workflow/start (academic_paper)` | taskId returned | HTTP 200 taskId=9510b503-5561-4e30-ad1e-603cfa29461e | passed |  |
| document | `GET /api/document/paper-workflow/tasks/:taskId (academic_paper)` | completed structured paper result with artifactId/sourceRefs/exportRefs | status=completed paperType=research chain=paper-workflow-web-adapter artifactId=paper-mph7ll56 | passed |  |
| document | `POST /api/document/paper-workflow/start (literature_review)` | taskId returned | HTTP 200 taskId=61a011e5-b2a6-4e68-a118-d481f54517c9 | passed |  |
| document | `GET /api/document/paper-workflow/tasks/:taskId (literature_review)` | completed structured paper result with artifactId/sourceRefs/exportRefs | status=completed paperType=review chain=paper-workflow-web-adapter artifactId=paper-mph7lrw8 | passed |  |
| document | `POST /api/document/paper-workflow/tasks/:taskId/cancel` | cancelled status | HTTP 200 status=cancelled | passed |  |
| document | `POST /api/document/formal-template/start` | taskId returned | HTTP 200 taskId=410d5734-ae90-4fe7-977f-f7ac5b64e84c | passed |  |
| document | `GET /api/document/formal-template/tasks/:taskId` | completed formal template with analyze/confirm/preview/commit and artifact metadata | status=completed phases=analyze,confirm,preview,commit,completed artifactId=formal-template-mph7m1xs | passed |  |
| document | `POST /api/skills/web.docx.export/run` | Word export returns docx artifact | HTTP 200 | passed |  |
| document | `POST /api/document/import-docx` | fixtures/test-duty.docx exists | fixture missing | skipped | Created docs/smoke/manual-fixtures-needed.md |
| ppt | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| ppt | `POST /api/ppt/decks/start (topic)` | taskId returned | HTTP 200 taskId=69b05063-0815-43a4-af8b-ec158fedd287 | passed |  |
| ppt | `GET /api/ppt/decks/tasks/:taskId (topic)` | completed task with deckId and artifact relationship | status=completed deckId=ed037e4e-49ff-47a3-a94a-1bee56f8d521 artifact=08b506dc-8da9-4f74-8e97-b95dbf04df24 | passed |  |
| ppt | `GET /api/ppt/decks/ed037e4e-49ff-47a3-a94a-1bee56f8d521` | DeckDocument has slides, template manifest, slide diagnostics | HTTP 200 slides=6 | passed |  |
| ppt | `GET /api/ppt/decks/ed037e4e-49ff-47a3-a94a-1bee56f8d521/download` | download returns PPTX artifact/file | HTTP 200 bytes=76264 | passed |  |
| ppt | `POST /api/ppt/decks/ed037e4e-49ff-47a3-a94a-1bee56f8d521/retemplate` | retemplate preview is zero-token | HTTP 200 tokenUsed=false | passed |  |
| ppt | `POST /api/aios/matters` | matter fixture created for Matter -> PPT | HTTP 201 matterId=56743ef5-dd2e-46f4-830e-1418bc04ca32 | passed |  |
| ppt | `POST /api/ppt/decks/start (matter)` | taskId returned | HTTP 200 taskId=9692eb75-06bf-452e-afad-3eb0a8d2e157 | passed |  |
| ppt | `GET /api/ppt/decks/tasks/:taskId (matter)` | completed task with deckId and artifact relationship | status=completed deckId=5e5a1209-f0ae-45db-9004-4d90b798d06e artifact=59d763d5-f0f3-41c5-8c7b-c01b0ad89bfa | passed |  |
| ppt | `src/bridges/document-to-ppt/convertDocumentToDeckInput` | document-to-ppt bridge returns deck input without importing PPT internals | sourceFeature=document slides=2 | passed |  |
| email | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| email | `GET /api/email/accounts` | account list endpoint reports configuration status | HTTP 200 configured=true | passed |  |
| email | `POST /api/email/drafts/dry-run` | dry-run recipient resolver returns salutations without sending | HTTP 200 recipients=2 | passed |  |
| email | `POST /api/email/drafts/artifact` | reply draft is saved as email_draft Artifact | HTTP 200 artifact=0646b9a0-baec-4888-9826-762b50401001 | passed |  |
| email | `POST /api/email/attachments/artifacts` | attachment payload is saved as Artifact with email relationship | HTTP 200 artifacts=1 | passed |  |
| email | `POST /api/aios/matters/from-email` | email converts to Matter | HTTP 201 matterId=a461f92a-8845-4184-9323-5bff98dc91db | passed |  |
| email | `POST /api/aios/matters/a461f92a-8845-4184-9323-5bff98dc91db/generate-document` | mail Matter can generate document Artifact | HTTP 200 artifact=708e60bf-cc40-42b1-8dcd-b1f89eab8f25 | passed |  |
| email | `POST /api/aios/matters/a461f92a-8845-4184-9323-5bff98dc91db/generate-ppt` | mail Matter can generate PPT Artifact | HTTP 200 artifact=8f4b814e-9893-4cc2-a620-3a4eb15fcfd9 | passed |  |
| email | `GET /api/email/messages?folder=inbox` | inbox fetch succeeds when account is configured | HTTP 200 messages=30 | passed |  |
| email | `POST /api/email/triage/start` | triage task starts for unread-only messages | HTTP 200 taskId=c5b3e7d4-a0d8-43d4-97d6-321c55d43842 | passed |  |
| email | `GET /api/email/triage/tasks/:taskId` | completed triage with categories, summaries, priorities, draft relationships, unread guard, and cache key | status=completed results=10 cacheKey=email-triage:1779471982888 | passed |  |
| email | `POST /api/email/messages/828/attachments/0/artifact` | real email attachment converts to Artifact | HTTP 200 artifact=496a7323-9f75-43a6-99d5-f12e72a6a954 | passed |  |
| artifact-knowledge | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| artifact-knowledge | `POST /api/artifacts` | document artifact created with source/knowledge/matter/email/deck/document refs | HTTP 201 artifact=d6008121-693c-4554-99f2-c09095a5fc37 | passed |  |
| artifact-knowledge | `GET /api/artifacts/d6008121-693c-4554-99f2-c09095a5fc37` | artifact detail includes relationship metadata | HTTP 200 artifact=d6008121-693c-4554-99f2-c09095a5fc37 | passed |  |
| artifact-knowledge | `GET /api/artifacts/d6008121-693c-4554-99f2-c09095a5fc37/relationships` | relationship graph exposes sourceRefs and knowledgeRefs | HTTP 200 nodes=3 | passed |  |
| artifact-knowledge | `GET /api/artifacts/d6008121-693c-4554-99f2-c09095a5fc37/preview` | markdown preview is available | HTTP 200 bytes=74 | passed |  |
| artifact-knowledge | `PATCH /api/artifacts/d6008121-693c-4554-99f2-c09095a5fc37` | artifact can be renamed | HTTP 200 title=Artifact Knowledge Smoke Renamed | passed |  |
| artifact-knowledge | `GET /api/artifacts/d6008121-693c-4554-99f2-c09095a5fc37/download` | artifact download returns file | HTTP 200 bytes=74 | passed |  |
| artifact-knowledge | `GET /api/knowledge/scientific-papers/parity-status` | knowledge parity status reports partial capability matrix | HTTP 200 status=partial | passed |  |
| artifact-knowledge | `GET /api/knowledge/scientific-papers/documents` | knowledge document list succeeds or reports remote-service partial | HTTP 200 documents=52 | passed |  |
| artifact-knowledge | `POST /api/knowledge/scientific-papers/import` | knowledge import succeeds or reports remote-service partial | HTTP 502 | skipped |  |
| artifact-knowledge | `DELETE /api/knowledge/scientific-papers/documents/:documentId` | delete imported test document when import succeeds | skipped because import did not return documentId | skipped |  |
| artifact-knowledge | `DELETE /api/artifacts/d6008121-693c-4554-99f2-c09095a5fc37` | artifact can be deleted | HTTP 200 | passed |  |
| aios | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| aios | `POST /api/aios/matters` | Matter created as draft with point_to_many route type | HTTP 201 matterId=56a4072e-575d-41bf-9f1d-a9b67b746d7b status=draft | passed |  |
| aios | `POST /api/artifacts (evidence)` | evidence attachment Artifact created | HTTP 201 artifact=f4dbdf63-e40f-4092-b363-1f2710ae0719 | passed |  |
| aios | `POST /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b/evidence` | email evidence added | HTTP 201 evidence=dace6996-5ec5-49ab-941f-e7a8c59e910b | passed |  |
| aios | `POST /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b/evidence` | attachment evidence links an Artifact | HTTP 201 artifactId=f4dbdf63-e40f-4092-b363-1f2710ae0719 | passed |  |
| aios | `POST /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b/evidence` | knowledge evidence carries verification status | HTTP 201 verification=partial | passed |  |
| aios | `GET /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b` | Matter lifecycle moved to collecting_evidence after evidence | HTTP 200 status=collecting_evidence | passed |  |
| aios | `POST /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b/decision-package` | DecisionPackage includes source references and knowledge verification status | HTTP 200 refs=3 | passed |  |
| aios | `GET /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b` | Matter lifecycle moved to decision_package_ready | HTTP 200 status=decision_package_ready | passed |  |
| aios | `POST /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b/generate-reply` | reply draft Artifact generated with matter relationship | HTTP 200 artifact=100f54fc-4c01-4ee8-a5b1-4a437462cab6 | passed |  |
| aios | `GET /api/artifacts/100f54fc-4c01-4ee8-a5b1-4a437462cab6/relationships` | reply Artifact carries matter/source relationship | HTTP 200 matterId=56a4072e-575d-41bf-9f1d-a9b67b746d7b | passed |  |
| aios | `POST /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b/generate-document` | document Artifact generated with matter relationship | HTTP 200 artifact=3ef2a26f-e38a-4693-ae0b-557a8b246708 | passed |  |
| aios | `GET /api/artifacts/3ef2a26f-e38a-4693-ae0b-557a8b246708/relationships` | document Artifact carries matter/source relationship | HTTP 200 matterId=56a4072e-575d-41bf-9f1d-a9b67b746d7b | passed |  |
| aios | `POST /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b/generate-ppt` | PPT Artifact generated with matter relationship | HTTP 200 artifact=70553893-739c-443f-b21f-4965b0b84fb6 | passed |  |
| aios | `GET /api/artifacts/70553893-739c-443f-b21f-4965b0b84fb6/relationships` | ppt Artifact carries matter/source relationship | HTTP 200 matterId=56a4072e-575d-41bf-9f1d-a9b67b746d7b | passed |  |
| aios | `GET /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b/audit` | audit contains lifecycle and generation events | HTTP 200 events=10 | passed |  |
| aios | `GET /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b/audit/replay` | audit replay returns full events | HTTP 200 replay=10 | passed |  |
| aios | `PATCH /api/aios/matters/56a4072e-575d-41bf-9f1d-a9b67b746d7b` | Matter lifecycle can complete | HTTP 200 status=completed | passed |  |
| image | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| image | `POST /api/image/jobs/start` | image job starts | HTTP 200 jobId=ee98ad88-e2e8-44d4-b061-936c9cc593ac | passed |  |
| image | `GET /api/image/jobs/:jobId` | image provider unavailable is explicit partial, not fake success | status=failed error=图片生成失败 (404)： | skipped |  |
| image | `POST /api/image/jobs/start (cancel)` | cancel target job starts | HTTP 200 jobId=75ec36cf-4169-4c88-ab22-5f8ad699fe13 | passed |  |
| image | `POST /api/image/jobs/75ec36cf-4169-4c88-ab22-5f8ad699fe13/cancel` | image job cancel endpoint returns cancelled | HTTP 200 status=cancelled | passed |  |
| data-analysis | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| data-analysis | `POST /api/files/upload` | CSV fixture uploaded | HTTP 200 fileId=80eadeae-b1d4-4773-97d2-2ff6924e275b | passed |  |
| data-analysis | `POST /api/data-analysis/jobs/start` | analysis job starts | HTTP 200 jobId=7c7afc37-51df-4f98-ab01-70a683f5baf3 | passed |  |
| data-analysis | `GET /api/data-analysis/jobs/:jobId` | analysis job completes with markdown report Artifact | status=completed artifact=7b921328-af96-4838-8b5a-bcaeb7d6a8e9 | passed |  |
| data-analysis | `GET /api/data-analysis/jobs/7c7afc37-51df-4f98-ab01-70a683f5baf3/artifacts` | analysis job exposes Artifact list | HTTP 200 artifacts=1 | passed |  |
| data-analysis | `GET /api/artifacts/7b921328-af96-4838-8b5a-bcaeb7d6a8e9/preview` | markdown analysis preview is readable | HTTP 200 bytes=614 | passed |  |
| data-analysis | `GET /api/artifacts/7b921328-af96-4838-8b5a-bcaeb7d6a8e9/relationships` | analysis Artifact carries source file reference | HTTP 200 documentId=80eadeae-b1d4-4773-97d2-2ff6924e275b | passed |  |
| report | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| report | `POST /api/aios/matters` | Matter fixture created for report | HTTP 201 matterId=0c6d3687-6527-4a1b-9838-89cf9e1cad9b | passed |  |
| report | `POST /api/artifacts` | Artifact fixture created for report | HTTP 201 artifact=65e23748-40a5-4218-a04c-d36d339a0a2d | passed |  |
| report | `POST /api/work-report/events` | work report event recorded: matter | HTTP 200 event=f48122fb-0275-4222-8b3c-966e173881c4 | passed |  |
| report | `POST /api/work-report/events` | work report event recorded: artifact | HTTP 200 event=01727af7-f0a9-404d-a35b-8ae65c0899f1 | passed |  |
| report | `POST /api/work-report/events` | work report event recorded: email | HTTP 200 event=6ce86cab-b0cd-45be-8c44-4de01a34c024 | passed |  |
| report | `GET /api/work-report/daily?date=2026-05-22&workspacePath=web-workspace%3A7b33dbd9-1a28-48e4-b2a3-226e3b0f6494%3A32425493-bbc7-481e-8c25-92ff13fbc626` | daily report includes Matter/Artifact/email events and emits Artifact | HTTP 200 artifact=490e6a61-6775-4dd7-b35e-c5d3f53e9c69 events=3 | passed |  |
| report | `GET /api/work-report/summary?date=2026-05-22` | summary aggregates modules | HTTP 200 eventCount=3 | passed |  |
| report | `GET /api/work-report/subordinates` | subordinates endpoint returns partial when hierarchy is unavailable | HTTP 200 subordinates=0 | passed |  |
| communication | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| communication | `GET /api/chat/rooms` | rooms list returns at least one room | HTTP 200 roomId=web-internal-general | passed |  |
| communication | `POST /api/chat/rooms/web-internal-general/messages` | send chat message | HTTP 200 message=25d20cd2-4a2c-450a-8ca8-08a28640531f | passed |  |
| communication | `GET /api/chat/rooms/web-internal-general/messages` | list chat messages includes smoke message | HTTP 200 messages=2 | passed |  |
| communication | `GET /api/directory` | directory endpoint returns partial provider status | HTTP 200 people=1 | passed |  |
| communication | `POST /api/chat/rooms/web-internal-general/matter` | chat-to-Matter creates real Matter with evidence | HTTP 201 matter=d3d3f57d-0ac1-4570-ad31-5de5d38a4f5e | passed |  |
| skill | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| skill | `GET /api/skills` | built-in skills list contains daily report skill | HTTP 200 skills=16 | passed |  |
| skill | `POST /api/skills/web.daily.report/run` | direct skill run returns report Artifact | HTTP 200 artifact=169897a6-0179-4ef1-bb9f-0f5060818bc6 | passed |  |
| skill | `GET /api/skill-center/status` | skill center status exposes partial AOSKIN gap | HTTP 200 status=partial | passed |  |
| skill | `POST /api/skill-center/jobs/start` | async skill-center job starts | HTTP 200 jobId=bad0360a-b51e-4e15-a494-35eaa688bdb2 | passed |  |
| skill | `GET /api/skill-center/jobs/:jobId` | async skill-center job completes with Artifact or no-artifact reason | status=completed artifact=754aa835-e4aa-4ab1-92d3-4c0e988e07e0 | passed |  |
| settings | `GET /api/auth/me` | auth/me returns current user without exposing secrets | HTTP 200 | passed |  |
| settings | `GET /api/settings/ai` | AI settings view masks provider key | HTTP 200 provider=qwen hasApiKey=true | passed |  |
| settings | `POST /api/settings/ai/test` | AI connection test succeeds or returns explicit provider failure without key leak | HTTP 200 ok=true | passed |  |
| settings | `GET /api/settings/parity-status` | settings parity status returns partial gaps without key leak | HTTP 200 status=partial | passed |  |
