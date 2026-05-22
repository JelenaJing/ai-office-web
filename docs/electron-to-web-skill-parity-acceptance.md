# Electron to Web Skill Runtime / Store Parity Acceptance

## Acceptance checklist

- [ ] Built-in skills list through `GET /api/skills`.
- [ ] Built-in sync execution remains available through `POST /api/skills/:skillId/run`.
- [ ] Skill Center status is available through `GET /api/skill-center/status`.
- [ ] Selected built-in Skill jobs start through `POST /api/skill-center/jobs/start`.
- [ ] Skill job status is available through `GET /api/skill-center/jobs/:jobId`.
- [ ] Skill job cancel is available through `POST /api/skill-center/jobs/:jobId/cancel`.
- [ ] Frontend Skill Center runtime helpers exist.
- [ ] Responses include `partialMissing` for remote store and AOSKIN gaps.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

Web built-in skills are available; remote store installation and generalized AOSKIN execution remain pending.
