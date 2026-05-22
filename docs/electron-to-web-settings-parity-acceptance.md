# Electron to Web Settings / Account / Model Parity Acceptance

## Acceptance checklist

- [x] Auth identity loads through `GET /api/auth/me`.
- [x] AI settings load through `GET /api/settings/ai`.
- [x] AI connection test works through `POST /api/settings/ai/test`.
- [x] Settings parity status is available through `GET /api/settings/parity-status`.
- [x] Model/provider responses do not expose raw API keys.
- [ ] Legacy `server/src/routes/settings.ts` is a thin feature-router re-export.
- [ ] AccountCenter token lookup supports current and legacy local storage token keys.
- [x] Responses include `partialMissing` for server-env model config, roles, workspace config, and Electron settings gaps.
- [x] `npm run check:boundaries` passes.
- [x] `npm run build:web` passes.
- [x] `cd server && npm run build` passes.
- [x] `npx tsx scripts/smoke/run-web-parity-smoke.ts settings` passes.

## Current status

**partial**

AI settings and connection testing are Web-server backed. Full admin settings and role/permission parity remain pending.

## Deep E2E coverage

- Smoke verifies `/api/auth/me` works with the same login token used by other Web parity smokes.
- Smoke verifies `/api/settings/ai` returns masked configuration with `hasApiKey` instead of a raw key.
- Smoke verifies `/api/settings/ai/test` succeeds or returns explicit provider failure without secret leakage.
- Smoke verifies parity status remains partial for editable/provider/admin settings gaps.
