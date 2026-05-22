# Electron to Web Settings / Account / Model Parity Audit

## Source of truth

- `server/src/routes/auth.ts`
- `server/src/routes/settings.ts`
- `server/src/features/settings/services/aiSettings.ts`
- `src/contexts/InternalAccountContext.tsx`
- `src/platform/webPlatformApi.ts`
- `src/utils/aiToolSettings.ts`

## Web status

**partial**

Settings routes now re-export the feature-owned settings router, and Web exposes a parity-status endpoint for AccountCenter token unification, model/provider configuration, email config location, and missing role/workspace/Electron settings parity.

## Web APIs

- `GET /api/settings/ai`
- `POST /api/settings/ai/test`
- `GET /api/settings/parity-status`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/email/account`

## Remaining gaps

- Model/provider settings are server-env read-only.
- Role and permission matrix is not fully exposed.
- Workspace configuration persistence is partial.
- Electron settings store is not fully ported to Web server settings.

## Migration confidence

High for read-only AI configuration and connection testing; medium for auth token consistency; low for full admin settings parity.
