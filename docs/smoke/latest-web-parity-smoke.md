# Latest Web Parity Smoke Report

- Started: 2026-05-22T17:33:59.748Z
- Finished: 2026-05-22T17:34:44.173Z
- Base URL: http://127.0.0.1:3001
- Modules: aios
- Totals: passed 19, failed 0, skipped 0

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| aios | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| aios | `POST /api/aios/matters` | Matter created as draft with point_to_many route type | HTTP 201 matterId=f8571f09-e378-4b89-a5b5-6006cdccb0f0 status=draft | passed |  |
| aios | `POST /api/artifacts (evidence)` | evidence attachment Artifact created | HTTP 201 artifact=4c294946-a042-4e03-b429-75444e2a2139 | passed |  |
| aios | `POST /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0/evidence` | email evidence added | HTTP 201 evidence=a7c06a04-b98c-4591-ac18-24047a7ed5f9 | passed |  |
| aios | `POST /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0/evidence` | attachment evidence links an Artifact | HTTP 201 artifactId=4c294946-a042-4e03-b429-75444e2a2139 | passed |  |
| aios | `POST /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0/evidence` | knowledge evidence carries verification status | HTTP 201 verification=partial | passed |  |
| aios | `GET /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0` | Matter lifecycle moved to collecting_evidence after evidence | HTTP 200 status=collecting_evidence | passed |  |
| aios | `POST /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0/decision-package` | DecisionPackage includes source references and knowledge verification status | HTTP 200 refs=3 | passed |  |
| aios | `GET /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0` | Matter lifecycle moved to decision_package_ready | HTTP 200 status=decision_package_ready | passed |  |
| aios | `POST /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0/generate-reply` | reply draft Artifact generated with matter relationship | HTTP 200 artifact=e683509b-cfd8-4cbe-aaf5-d10a8769ab6d | passed |  |
| aios | `GET /api/artifacts/e683509b-cfd8-4cbe-aaf5-d10a8769ab6d/relationships` | reply Artifact carries matter/source relationship | HTTP 200 matterId=f8571f09-e378-4b89-a5b5-6006cdccb0f0 | passed |  |
| aios | `POST /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0/generate-document` | document Artifact generated with matter relationship | HTTP 200 artifact=20d5b2de-2a49-4084-aac3-707cd1dc1ab6 | passed |  |
| aios | `GET /api/artifacts/20d5b2de-2a49-4084-aac3-707cd1dc1ab6/relationships` | document Artifact carries matter/source relationship | HTTP 200 matterId=f8571f09-e378-4b89-a5b5-6006cdccb0f0 | passed |  |
| aios | `POST /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0/generate-ppt` | PPT Artifact generated with matter relationship | HTTP 200 artifact=7fc1c64f-721a-40a0-893f-0b490779da23 | passed |  |
| aios | `GET /api/artifacts/7fc1c64f-721a-40a0-893f-0b490779da23/relationships` | ppt Artifact carries matter/source relationship | HTTP 200 matterId=f8571f09-e378-4b89-a5b5-6006cdccb0f0 | passed |  |
| aios | `GET /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0/audit` | audit contains lifecycle and generation events | HTTP 200 events=10 | passed |  |
| aios | `GET /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0/audit/replay` | audit replay returns full events | HTTP 200 replay=10 | passed |  |
| aios | `PATCH /api/aios/matters/f8571f09-e378-4b89-a5b5-6006cdccb0f0` | Matter lifecycle can complete | HTTP 200 status=completed | passed |  |
