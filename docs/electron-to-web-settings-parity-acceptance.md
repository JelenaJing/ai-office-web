# Electron to Web Settings / Account / Model Parity Acceptance

## Acceptance checklist

- [ ] AI settings load through `GET /api/settings/ai`.
- [ ] AI connection test works through `POST /api/settings/ai/test`.
- [ ] Settings parity status is available through `GET /api/settings/parity-status`.
- [ ] Legacy `server/src/routes/settings.ts` is a thin feature-router re-export.
- [ ] AccountCenter token lookup supports current and legacy local storage token keys.
- [ ] Responses include `partialMissing` for server-env model config, roles, workspace config, and Electron settings gaps.
- [ ] `npm run check:boundaries` passes.
- [ ] `npm run build:web` passes.
- [ ] `cd server && npm run build` passes.

## Current status

**partial**

AI settings and connection testing are Web-server backed. Full admin settings and role/permission parity remain pending.
