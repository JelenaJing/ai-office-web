# Email Login Fallback Parity Audit

## Legacy behavior found

- Local Electron fallback is implemented in `ai-office-public-review/electron/main/index.ts` via `internalAccount:loginMailbox`.
- It derives a school mailbox from the username, probes IMAP/SMTP, saves encrypted credentials, marks the session as `mailbox-fallback`, and stores a mail binding.
- CUHK school preset evidence is in `ai-office-public-review/electron/main/services/mail/schoolExchangeConfig.ts`: `mail.cuhk.edu.cn`, IMAP `143`, SMTP `587`, STARTTLS-first probing.
- Internal AI Office mail evidence is in `ai-office-public-review/electron/main/services/mail/internalMailConfig.ts`: `ai.cuhk.edu.cn`, IMAP `993` SSL, SMTP `465` SSL.

## Web parity implementation

- `server/src/routes/auth.ts` now performs AccountCenter candidates first, then email fallback.
- `server/src/features/auth/services/emailLoginFallback.ts` owns fallback orchestration and provisioning gates.
- `server/src/features/email/services/emailProviderPresets.ts` owns CUHK, Link CUHK, internal mailcow, 163, and custom presets.
- `server/src/features/email/services/mailboxAutoBinder.ts` creates/updates the encrypted Web mailbox binding.
- `server/src/features/auth/services/webAuthToken.ts` issues local Web auth tokens for provisioned mailbox-login users.
- `server/src/lib/authUser.ts` accepts those local tokens, so email, artifact, report, and AIOS routes can use the provisioned user id.

## Gaps and controls

- `EMAIL_LOGIN_FALLBACK_ENABLED` and `EMAIL_LOGIN_PROVISIONING_ENABLED` default to enabled outside production and are production-controlled by env.
- AccountCenter success does not block on mailbox probing unless `EMAIL_ACCOUNT_CENTER_AUTO_BIND=true`.
- Real IMAP/SMTP acceptance requires `EMAIL_FALLBACK_TEST_USERNAME` and `EMAIL_FALLBACK_TEST_PASSWORD`; otherwise tests verify derivation and clear diagnostics only.
