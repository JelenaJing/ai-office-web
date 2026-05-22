# Latest Web Parity Smoke Report

- Started: 2026-05-22T17:30:12.879Z
- Finished: 2026-05-22T17:30:22.014Z
- Base URL: http://127.0.0.1:3001
- Modules: artifact-knowledge
- Totals: passed 11, failed 0, skipped 2

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| artifact-knowledge | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| artifact-knowledge | `POST /api/artifacts` | document artifact created with source/knowledge/matter/email/deck/document refs | HTTP 201 artifact=4d4a4fed-b336-4e90-ab0c-048fa14f1814 | passed |  |
| artifact-knowledge | `GET /api/artifacts/4d4a4fed-b336-4e90-ab0c-048fa14f1814` | artifact detail includes relationship metadata | HTTP 200 artifact=4d4a4fed-b336-4e90-ab0c-048fa14f1814 | passed |  |
| artifact-knowledge | `GET /api/artifacts/4d4a4fed-b336-4e90-ab0c-048fa14f1814/relationships` | relationship graph exposes sourceRefs and knowledgeRefs | HTTP 200 nodes=3 | passed |  |
| artifact-knowledge | `GET /api/artifacts/4d4a4fed-b336-4e90-ab0c-048fa14f1814/preview` | markdown preview is available | HTTP 200 bytes=74 | passed |  |
| artifact-knowledge | `PATCH /api/artifacts/4d4a4fed-b336-4e90-ab0c-048fa14f1814` | artifact can be renamed | HTTP 200 title=Artifact Knowledge Smoke Renamed | passed |  |
| artifact-knowledge | `GET /api/artifacts/4d4a4fed-b336-4e90-ab0c-048fa14f1814/download` | artifact download returns file | HTTP 200 bytes=74 | passed |  |
| artifact-knowledge | `GET /api/knowledge/scientific-papers/parity-status` | knowledge parity status reports partial capability matrix | HTTP 200 status=partial | passed |  |
| artifact-knowledge | `GET /api/knowledge/scientific-papers/documents` | knowledge document list succeeds or reports remote-service partial | HTTP 200 documents=51 | passed |  |
| artifact-knowledge | `POST /api/knowledge/scientific-papers/import` | knowledge import succeeds or reports remote-service partial | HTTP 502 | skipped |  |
| artifact-knowledge | `DELETE /api/knowledge/scientific-papers/documents/:documentId` | delete imported test document when import succeeds | skipped because import did not return documentId | skipped |  |
| artifact-knowledge | `DELETE /api/artifacts/4d4a4fed-b336-4e90-ab0c-048fa14f1814` | artifact can be deleted | HTTP 200 | passed |  |
