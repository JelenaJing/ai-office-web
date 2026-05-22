# Electron to Web Skill Runtime / Store Parity Audit

## Source of truth

- `server/src/routes/skills.ts`
- `server/src/features/skill-center/routes.ts`
- `src/features/skill-center/components/SkillDevPanel.tsx`
- `ai-office-public-review/scripts/test-phase4.ts`
- `ai-office-public-review/scripts/test-slot-content-fit.ts`

## Web status

**partial**

The Web server already exposes built-in skill list/run APIs. This phase adds a Skill Center status endpoint and a selected-builtins async job wrapper so callers can distinguish current Web runtime capabilities from missing remote-store/AOSKIN parity.

## Web APIs

- `GET /api/skills`
- `GET /api/skills/:skillId`
- `POST /api/skills/:skillId/run`
- `GET /api/skill-center/status`
- `POST /api/skill-center/jobs/start`
- `GET /api/skill-center/jobs/:jobId`
- `POST /api/skill-center/jobs/:jobId/cancel`

## Remaining gaps

- Remote skill store installation is not fully ported.
- AOSKIN package execution is not implemented in Web runtime.
- Async job API currently wraps selected Web built-in skills only.
- PPT/document template skills still depend on module-specific runtimes.

## Migration confidence

Medium for built-in skill list/run and selected async jobs; low for remote skill store parity.
