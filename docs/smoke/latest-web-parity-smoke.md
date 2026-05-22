# Latest Web Parity Smoke Report

- Started: 2026-05-22T17:38:28.022Z
- Finished: 2026-05-22T17:38:29.605Z
- Base URL: http://127.0.0.1:3001
- Modules: image
- Totals: passed 5, failed 0, skipped 1

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| image | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| image | `POST /api/image/jobs/start` | image job starts | HTTP 200 jobId=93cfc83b-8e4a-4016-ab57-bc9748476dec | passed |  |
| image | `GET /api/image/jobs/:jobId` | image provider unavailable is explicit partial, not fake success | status=failed error=图片生成失败 (404)： | skipped |  |
| image | `POST /api/image/jobs/start (cancel)` | cancel target job starts | HTTP 200 jobId=dd9057e6-7145-4170-9b95-a542f0916b63 | passed |  |
| image | `POST /api/image/jobs/dd9057e6-7145-4170-9b95-a542f0916b63/cancel` | image job cancel endpoint returns cancelled | HTTP 200 status=cancelled | passed |  |
