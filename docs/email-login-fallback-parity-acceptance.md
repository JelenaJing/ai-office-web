# Email Login Fallback Acceptance

## Required behavior

- `guozhihang` derives mailbox candidates in this order:
  1. `guozhihang@cuhk.edu.cn`
  2. `guozhihang@link.cuhk.edu.cn`
  3. `guozhihang@ai.cuhk.edu.cn`
- `guozhihang@cuhk.edu.cn` is used as-is and mapped to the CUHK provider preset.
- AccountCenter is tried first with username and CUHK-domain variants.
- If AccountCenter fails and IMAP/SMTP both pass, Web provisions a local user, creates a Web token, and auto-binds the successful mailbox.
- `GET /api/email/accounts` returns the auto-bound mailbox without asking the user to configure it again.
- SMTP `From` uses the bound mailbox address because `sendPlainEmail()` sends from `account.user`.

## Acceptance commands

```bash
npm run check:boundaries
npm run build:web
cd server && npm run build
cd ..
npx tsx scripts/smoke/email-login-fallback-smoke.ts
npx tsx scripts/smoke/run-web-parity-smoke.ts email
npm run e2e:web -- --grep "email login fallback"
```

## Expected partial behavior

- Without real `EMAIL_FALLBACK_TEST_USERNAME` / `EMAIL_FALLBACK_TEST_PASSWORD`, real mailbox login is skipped, but fake-password diagnostics must list the tried mailbox candidates and must not return a generic 500.
