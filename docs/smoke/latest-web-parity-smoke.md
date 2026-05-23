# Latest Web Parity Smoke Report

- Started: 2026-05-23T07:04:56.321Z
- Finished: 2026-05-23T07:09:29.829Z
- Base URL: http://127.0.0.1:3001
- Modules: document, ppt, email, artifact-knowledge, aios, image, data-analysis, report, communication, skill, settings
- Totals: passed 97, failed 0, skipped 4

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| document | `GET /api/workspaces/default` | default workspace path | workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| document | `POST /api/skills/web.document.generate/run` | normal document returns html/session or artifact | HTTP 200 | passed |  |
| document | `POST /api/document/paper-workflow/start (academic_paper)` | taskId returned | HTTP 200 taskId=d3f61767-ac0f-4b0b-8138-6bd65b89047c | passed |  |
| document | `GET /api/document/paper-workflow/tasks/:taskId (academic_paper)` | completed structured paper result with artifactId/sourceRefs/exportRefs | status=completed paperType=research chain=paper-workflow-web-adapter artifactId=paper-mpi082xe | passed |  |
| document | `POST /api/document/paper-workflow/start (literature_review)` | taskId returned | HTTP 200 taskId=41602edf-3380-4576-b953-1c10276e4600 | passed |  |
| document | `GET /api/document/paper-workflow/tasks/:taskId (literature_review)` | completed structured paper result with artifactId/sourceRefs/exportRefs | status=completed paperType=review chain=paper-workflow-web-adapter artifactId=paper-mpi08muc | passed |  |
| document | `POST /api/document/paper-workflow/tasks/:taskId/cancel` | cancelled status | HTTP 200 status=cancelled | passed |  |
| document | `POST /api/document/formal-template/start` | taskId returned | HTTP 200 taskId=45244160-434e-4821-b97f-a1f468f5f29e | passed |  |
| document | `GET /api/document/formal-template/tasks/:taskId` | completed formal template with analyze/confirm/preview/commit and artifact metadata | status=completed phases=analyze,confirm,preview,commit,completed artifactId=formal-template-mpi0956n | passed |  |
| document | `POST /api/skills/web.docx.export/run` | Word export returns docx artifact | HTTP 200 | passed |  |
| document | `POST /api/document/import-docx` | fixtures/test-duty.docx exists | fixture missing | skipped | Created docs/smoke/manual-fixtures-needed.md |
| ppt | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| ppt | `POST /api/ppt/decks/start (topic)` | taskId returned | HTTP 200 taskId=3cf88fce-e316-4ec3-9911-207d8b068be5 | passed |  |
| ppt | `GET /api/ppt/decks/tasks/:taskId (topic)` | completed task with deckId and artifact relationship | status=completed deckId=567b883f-84b7-4ff5-82c7-75aaa069bfcd artifact=6a27942b-7e9b-4013-a842-8bae6ddac02d | passed |  |
| ppt | `GET /api/ppt/decks/567b883f-84b7-4ff5-82c7-75aaa069bfcd` | DeckDocument has slides, template manifest, slide diagnostics | HTTP 200 slides=7 | passed |  |
| ppt | `GET /api/ppt/decks/567b883f-84b7-4ff5-82c7-75aaa069bfcd/download` | download returns PPTX artifact/file | HTTP 200 bytes=78195 | passed |  |
| ppt | `POST /api/ppt/decks/567b883f-84b7-4ff5-82c7-75aaa069bfcd/retemplate` | retemplate preview is zero-token | HTTP 200 tokenUsed=false | passed |  |
| ppt | `POST /api/aios/matters` | matter fixture created for Matter -> PPT | HTTP 201 matterId=29f6d6ec-b3bf-4e87-92f8-d34c77839357 | passed |  |
| ppt | `POST /api/ppt/decks/start (matter)` | taskId returned | HTTP 200 taskId=c76712ce-66c1-4b8d-8bcd-b2bd6094715a | passed |  |
| ppt | `GET /api/ppt/decks/tasks/:taskId (matter)` | completed task with deckId and artifact relationship | status=completed deckId=98fd92bb-81c6-4f22-a8e2-e9fdf539f719 artifact=3754f794-431c-43c8-b2a0-54384675c157 | passed |  |
| ppt | `src/bridges/document-to-ppt/convertDocumentToDeckInput` | document-to-ppt bridge returns deck input without importing PPT internals | sourceFeature=document slides=2 | passed |  |
| email | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| email | `GET /api/email/accounts` | account list endpoint reports configuration status | HTTP 200 configured=true | passed |  |
| email | `POST /api/email/drafts/dry-run` | dry-run recipient resolver returns salutations without sending | HTTP 200 recipients=2 | passed |  |
| email | `POST /api/email/drafts/artifact` | reply draft is saved as email_draft Artifact | HTTP 200 artifact=653309d5-1e76-4ab2-b96a-89370f753d42 | passed |  |
| email | `POST /api/email/attachments/artifacts` | attachment payload is saved as Artifact with email relationship | HTTP 200 artifacts=1 | passed |  |
| email | `POST /api/aios/matters/from-email` | email converts to Matter | HTTP 201 matterId=f8a57f4f-2a5b-4911-a662-9b33959cf973 | passed |  |
| email | `POST /api/aios/matters/f8a57f4f-2a5b-4911-a662-9b33959cf973/generate-document` | mail Matter can generate document Artifact | HTTP 200 artifact=fa2878b2-41ef-4034-b1c3-a16671e3ad31 | passed |  |
| email | `POST /api/aios/matters/f8a57f4f-2a5b-4911-a662-9b33959cf973/generate-ppt` | mail Matter can generate PPT Artifact | HTTP 200 artifact=7b69c841-38b9-4335-8779-5d8f3a890ea8 | passed |  |
| email | `GET /api/email/messages?folder=inbox` | inbox fetch succeeds when account is configured | HTTP 200 messages=30 | passed |  |
| email | `POST /api/email/triage/start` | triage task starts for unread-only messages | HTTP 200 taskId=19cdf25b-b07a-4bbf-82e5-204e0ce80df8 | passed |  |
| email | `GET /api/email/triage/tasks/:taskId` | completed triage with categories, summaries, priorities, draft relationships, unread guard, and cache key | status=completed results=10 cacheKey=email-triage:1779520097129 | passed |  |
| email | `POST /api/email/messages/828/attachments/0/artifact` | real email attachment converts to Artifact | HTTP 200 artifact=22b06e9b-5065-44bd-a8d8-d6f08e844055 | passed |  |
| artifact-knowledge | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| artifact-knowledge | `POST /api/artifacts` | document artifact created with source/knowledge/matter/email/deck/document refs | HTTP 201 artifact=c221e0c7-d492-41ff-b184-440275b16207 | passed |  |
| artifact-knowledge | `GET /api/artifacts/c221e0c7-d492-41ff-b184-440275b16207` | artifact detail includes relationship metadata | HTTP 200 artifact=c221e0c7-d492-41ff-b184-440275b16207 | passed |  |
| artifact-knowledge | `GET /api/artifacts/c221e0c7-d492-41ff-b184-440275b16207/relationships` | relationship graph exposes sourceRefs and knowledgeRefs | HTTP 200 nodes=3 | passed |  |
| artifact-knowledge | `GET /api/artifacts/c221e0c7-d492-41ff-b184-440275b16207/preview` | markdown preview is available | HTTP 200 bytes=74 | passed |  |
| artifact-knowledge | `PATCH /api/artifacts/c221e0c7-d492-41ff-b184-440275b16207` | artifact can be renamed | HTTP 200 title=Artifact Knowledge Smoke Renamed | passed |  |
| artifact-knowledge | `GET /api/artifacts/c221e0c7-d492-41ff-b184-440275b16207/download` | artifact download returns file | HTTP 200 bytes=74 | passed |  |
| artifact-knowledge | `GET /api/knowledge/scientific-papers/parity-status` | knowledge parity status reports partial capability matrix | HTTP 200 status=partial | passed |  |
| artifact-knowledge | `GET /api/knowledge/scientific-papers/documents` | knowledge document list succeeds or reports remote-service partial | HTTP 200 documents=55 | passed |  |
| artifact-knowledge | `POST /api/knowledge/scientific-papers/import` | knowledge import succeeds or reports remote-service partial | HTTP 502 | skipped |  |
| artifact-knowledge | `DELETE /api/knowledge/scientific-papers/documents/:documentId` | delete imported test document when import succeeds | skipped because import did not return documentId | skipped |  |
| artifact-knowledge | `DELETE /api/artifacts/c221e0c7-d492-41ff-b184-440275b16207` | artifact can be deleted | HTTP 200 | passed |  |
| aios | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| aios | `POST /api/aios/matters` | Matter created as draft with point_to_many route type | HTTP 201 matterId=1d346021-a654-4959-a673-f2bbd98907f5 status=draft | passed |  |
| aios | `POST /api/artifacts (evidence)` | evidence attachment Artifact created | HTTP 201 artifact=5cc049bb-5286-4a9b-aeb5-4b03040db511 | passed |  |
| aios | `POST /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5/evidence` | email evidence added | HTTP 201 evidence=b120c410-886d-445b-814f-d53465970db7 | passed |  |
| aios | `POST /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5/evidence` | attachment evidence links an Artifact | HTTP 201 artifactId=5cc049bb-5286-4a9b-aeb5-4b03040db511 | passed |  |
| aios | `POST /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5/evidence` | knowledge evidence carries verification status | HTTP 201 verification=partial | passed |  |
| aios | `GET /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5` | Matter lifecycle moved to collecting_evidence after evidence | HTTP 200 status=collecting_evidence | passed |  |
| aios | `POST /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5/decision-package` | DecisionPackage includes source references and knowledge verification status | HTTP 200 refs=3 | passed |  |
| aios | `GET /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5` | Matter lifecycle moved to decision_package_ready | HTTP 200 status=decision_package_ready | passed |  |
| aios | `POST /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5/generate-reply` | reply draft Artifact generated with matter relationship | HTTP 200 artifact=58a5bea4-78a7-42c9-a480-bab138c5a6dd | passed |  |
| aios | `GET /api/artifacts/58a5bea4-78a7-42c9-a480-bab138c5a6dd/relationships` | reply Artifact carries matter/source relationship | HTTP 200 matterId=1d346021-a654-4959-a673-f2bbd98907f5 | passed |  |
| aios | `POST /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5/generate-document` | document Artifact generated with matter relationship | HTTP 200 artifact=814a9f4a-1ff6-43dc-9657-be147b4dbe52 | passed |  |
| aios | `GET /api/artifacts/814a9f4a-1ff6-43dc-9657-be147b4dbe52/relationships` | document Artifact carries matter/source relationship | HTTP 200 matterId=1d346021-a654-4959-a673-f2bbd98907f5 | passed |  |
| aios | `POST /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5/generate-ppt` | PPT Artifact generated with matter relationship | HTTP 200 artifact=73995da0-66cf-47f2-a09f-e68f61c5a061 | passed |  |
| aios | `GET /api/artifacts/73995da0-66cf-47f2-a09f-e68f61c5a061/relationships` | ppt Artifact carries matter/source relationship | HTTP 200 matterId=1d346021-a654-4959-a673-f2bbd98907f5 | passed |  |
| aios | `GET /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5/audit` | audit contains lifecycle and generation events | HTTP 200 events=10 | passed |  |
| aios | `GET /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5/audit/replay` | audit replay returns full events | HTTP 200 replay=10 | passed |  |
| aios | `PATCH /api/aios/matters/1d346021-a654-4959-a673-f2bbd98907f5` | Matter lifecycle can complete | HTTP 200 status=completed | passed |  |
| image | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| image | `POST /api/image/jobs/start` | image job starts | HTTP 200 jobId=3d3c24c3-7fb3-4c4a-a054-7c7183f3d9b5 | passed |  |
| image | `GET /api/image/jobs/:jobId` | image provider unavailable is explicit partial, not fake success | status=failed error=图片生成失败 (404)： | skipped |  |
| image | `POST /api/image/jobs/start (cancel)` | cancel target job starts | HTTP 200 jobId=f6b49157-b3c8-4e3b-a543-0e806ba63d22 | passed |  |
| image | `POST /api/image/jobs/f6b49157-b3c8-4e3b-a543-0e806ba63d22/cancel` | image job cancel endpoint returns cancelled | HTTP 200 status=cancelled | passed |  |
| data-analysis | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| data-analysis | `POST /api/files/upload` | CSV fixture uploaded | HTTP 200 fileId=90e7ac48-2827-45b6-a7e9-fe629c0258e1 | passed |  |
| data-analysis | `POST /api/data-analysis/jobs/start` | analysis job starts | HTTP 200 jobId=c0b83573-9e34-44fc-99d2-f893654a9753 | passed |  |
| data-analysis | `GET /api/data-analysis/jobs/:jobId` | analysis job completes with markdown report Artifact | status=completed artifact=940b8df9-4f51-4d1b-8b9c-7dc0eda55784 | passed |  |
| data-analysis | `GET /api/data-analysis/jobs/c0b83573-9e34-44fc-99d2-f893654a9753/artifacts` | analysis job exposes Artifact list | HTTP 200 artifacts=1 | passed |  |
| data-analysis | `GET /api/artifacts/940b8df9-4f51-4d1b-8b9c-7dc0eda55784/preview` | markdown analysis preview is readable | HTTP 200 bytes=614 | passed |  |
| data-analysis | `GET /api/artifacts/940b8df9-4f51-4d1b-8b9c-7dc0eda55784/relationships` | analysis Artifact carries source file reference | HTTP 200 documentId=90e7ac48-2827-45b6-a7e9-fe629c0258e1 | passed |  |
| report | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| report | `POST /api/aios/matters` | Matter fixture created for report | HTTP 201 matterId=b2eca368-db10-4208-8bd3-9a3c07d44442 | passed |  |
| report | `POST /api/artifacts` | Artifact fixture created for report | HTTP 201 artifact=e2d04ff2-a257-42c7-a5b1-3081e808b700 | passed |  |
| report | `POST /api/work-report/events` | work report event recorded: matter | HTTP 200 event=67d7a53a-afb1-4ff4-b499-13eb5df147c3 | passed |  |
| report | `POST /api/work-report/events` | work report event recorded: artifact | HTTP 200 event=79c36ef8-c4d0-49ad-b31a-9f506ab4a0b7 | passed |  |
| report | `POST /api/work-report/events` | work report event recorded: email | HTTP 200 event=0dc0b08b-47c0-453f-8e00-b7b05c997be8 | passed |  |
| report | `GET /api/work-report/daily?date=2026-05-23&workspacePath=web-workspace%3A7b33dbd9-1a28-48e4-b2a3-226e3b0f6494%3A32425493-bbc7-481e-8c25-92ff13fbc626` | daily report includes Matter/Artifact/email events and emits Artifact | HTTP 200 artifact=aa54492c-62fa-46a8-babc-0cc08f05c958 events=3 | passed |  |
| report | `GET /api/work-report/summary?date=2026-05-23` | summary aggregates modules | HTTP 200 eventCount=3 | passed |  |
| report | `GET /api/work-report/subordinates` | subordinates endpoint returns partial when hierarchy is unavailable | HTTP 200 subordinates=0 | passed |  |
| communication | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| communication | `GET /api/chat/rooms` | rooms list returns at least one room | HTTP 200 roomId=web-internal-general | passed |  |
| communication | `POST /api/chat/rooms/web-internal-general/messages` | send chat message | HTTP 200 message=53e8eaa0-fda3-4fac-a6be-e3f489a798e0 | passed |  |
| communication | `GET /api/chat/rooms/web-internal-general/messages` | list chat messages includes smoke message | HTTP 200 messages=1 | passed |  |
| communication | `GET /api/directory` | directory endpoint returns partial provider status | HTTP 200 people=1 | passed |  |
| communication | `POST /api/chat/rooms/web-internal-general/matter` | chat-to-Matter creates real Matter with evidence | HTTP 201 matter=3d26c03f-a14c-4784-a843-da357d322d81 | passed |  |
| skill | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| skill | `GET /api/skills` | built-in skills list contains daily report skill | HTTP 200 skills=16 | passed |  |
| skill | `POST /api/skills/web.daily.report/run` | direct skill run returns report Artifact | HTTP 200 artifact=7d142a09-de9f-4281-bc7b-b64d010cae45 | passed |  |
| skill | `GET /api/skill-center/status` | skill center status exposes partial AOSKIN gap | HTTP 200 status=partial | passed |  |
| skill | `POST /api/skill-center/jobs/start` | async skill-center job starts | HTTP 200 jobId=4962b110-2e75-4b89-85c2-866c78ad1985 | passed |  |
| skill | `GET /api/skill-center/jobs/:jobId` | async skill-center job completes with Artifact or no-artifact reason | status=completed artifact=7ba36f2c-9850-45f4-8b54-1e2005d07260 | passed |  |
| settings | `GET /api/auth/me` | auth/me returns current user without exposing secrets | HTTP 200 | passed |  |
| settings | `GET /api/settings/ai` | AI settings view masks provider key | HTTP 200 provider=qwen hasApiKey=true | passed |  |
| settings | `POST /api/settings/ai/test` | AI connection test succeeds or returns explicit provider failure without key leak | HTTP 200 ok=true | passed |  |
| settings | `GET /api/settings/parity-status` | settings parity status returns partial gaps without key leak | HTTP 200 status=partial | passed |  |
