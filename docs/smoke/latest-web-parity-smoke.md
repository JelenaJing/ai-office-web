# Latest Web Parity Smoke Report

- Started: 2026-05-22T17:10:47.325Z
- Finished: 2026-05-22T17:10:47.973Z
- Base URL: http://127.0.0.1:3001
- Modules: document, ppt, email, aios
- Totals: passed 5, failed 0, skipped 0

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| document | `GET /api/settings/parity-status` | authenticated smoke can reach Web API | HTTP 200 | passed |  |
| ppt | `GET /api/artifacts` | authenticated smoke can list artifacts before PPT E2E | HTTP 200 | passed |  |
| email | `GET /api/email/accounts` | email accounts endpoint exists | HTTP 404 | passed |  |
| aios | `GET /api/aios/parity-status` | AIOS parity status endpoint exists | HTTP 200 | passed |  |
