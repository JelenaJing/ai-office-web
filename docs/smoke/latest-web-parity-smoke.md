# Latest Web Parity Smoke Report

- Started: 2026-05-22T17:42:03.180Z
- Finished: 2026-05-22T17:42:04.876Z
- Base URL: http://127.0.0.1:3001
- Modules: skill
- Totals: passed 7, failed 0, skipped 0

| Module | Endpoint | Expected | Actual | Status | Error |
| --- | --- | --- | --- | --- | --- |
| auth | `POST /api/auth/login` | HTTP 2xx and token | HTTP 200 with token | passed |  |
| skill | `GET /api/workspaces/default` | workspace path | HTTP 200 workspace=web-workspace:7b33dbd9-1a28-48e4-b2a3-226e3b0f6494:32425493-bbc7-481e-8c25-92ff13fbc626 | passed |  |
| skill | `GET /api/skills` | built-in skills list contains daily report skill | HTTP 200 skills=16 | passed |  |
| skill | `POST /api/skills/web.daily.report/run` | direct skill run returns report Artifact | HTTP 200 artifact=2f56ab0c-a370-4d62-88ad-a8311af341f7 | passed |  |
| skill | `GET /api/skill-center/status` | skill center status exposes partial AOSKIN gap | HTTP 200 status=partial | passed |  |
| skill | `POST /api/skill-center/jobs/start` | async skill-center job starts | HTTP 200 jobId=dcc7f89b-0318-4675-9ec9-06e390f888f7 | passed |  |
| skill | `GET /api/skill-center/jobs/:jobId` | async skill-center job completes with Artifact or no-artifact reason | status=completed artifact=c58d9e27-8bad-44e5-b5c1-31d954682400 | passed |  |
