import assert from 'node:assert/strict'
import { deriveCandidateMailboxes } from '../../server/src/features/email/services/emailProviderPresets'
import { runEmailLoginFallback } from '../../server/src/features/auth/services/emailLoginFallback'
import { verifyWebAuthToken } from '../../server/src/features/auth/services/webAuthToken'
import { getEmailAccount, maskAccount } from '../../server/src/features/email/services/emailStore'

function print(status: 'passed' | 'skipped', name: string, detail?: string) {
  console.log(`${status === 'passed' ? '✓' : '○'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function main() {
  const usernameCandidates = deriveCandidateMailboxes('guozhihang').map((item) => item.email)
  assert.deepEqual(usernameCandidates, [
    'guozhihang@cuhk.edu.cn',
    'guozhihang@link.cuhk.edu.cn',
    'guozhihang@ai.cuhk.edu.cn',
  ])
  print('passed', 'deriveCandidateMailboxes username order')

  const emailCandidates = deriveCandidateMailboxes('guozhihang@cuhk.edu.cn')
  assert.equal(emailCandidates.length, 1)
  assert.equal(emailCandidates[0].email, 'guozhihang@cuhk.edu.cn')
  assert.equal(emailCandidates[0].provider, 'school-cuhk')
  print('passed', 'deriveCandidateMailboxes explicit email')

  process.env.EMAIL_LOGIN_FALLBACK_ENABLED = 'true'
  process.env.EMAIL_LOGIN_PROVISIONING_ENABLED = 'true'
  process.env.EMAIL_LOGIN_CONNECT_TIMEOUT_MS ||= '3000'
  process.env.EMAIL_LOGIN_GREETING_TIMEOUT_MS ||= '3000'
  process.env.EMAIL_LOGIN_SOCKET_TIMEOUT_MS ||= '5000'

  const fake = await runEmailLoginFallback({
    inputLogin: 'guozhihang',
    password: 'definitely-wrong-password-for-smoke',
    accountCenterErrors: [{ login: 'guozhihang', status: 401, message: 'fake AccountCenter failure' }],
  })
  assert.equal(fake.success, false)
  assert.match(fake.error || '', /AI Office 登录失败|邮箱验证成功/)
  assert.ok(fake.diagnostics.candidates.length >= 3)
  assert.ok(fake.diagnostics.candidates.every((item) => item.status === 'failed' || item.status === 'skipped'))
  print('passed', 'fake password returns clear fallback diagnostics')

  const realUsername = process.env.EMAIL_FALLBACK_TEST_USERNAME
  const realPassword = process.env.EMAIL_FALLBACK_TEST_PASSWORD
  if (!realUsername || !realPassword) {
    print('skipped', 'real fallback login', 'EMAIL_FALLBACK_TEST_USERNAME / EMAIL_FALLBACK_TEST_PASSWORD not set')
    return
  }

  const real = await runEmailLoginFallback({
    inputLogin: realUsername,
    password: realPassword,
    accountCenterErrors: [{ login: realUsername, status: 401, message: 'force fallback smoke path' }],
  })
  assert.equal(real.success, true, JSON.stringify(real.diagnostics, null, 2))
  assert.ok(real.token)
  assert.ok(real.user)
  assert.ok(real.autoBoundMailbox?.email)
  const tokenUser = verifyWebAuthToken(real.token)
  assert.equal(tokenUser?.id, real.user.id)
  const account = getEmailAccount(real.user.id)
  assert.equal(account?.email || account?.user, real.autoBoundMailbox.email)
  assert.ok(!('password' in maskAccount(account)), 'masked account must not expose plaintext password')
  print('passed', 'real fallback login and auto mailbox binding', real.autoBoundMailbox.email)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
