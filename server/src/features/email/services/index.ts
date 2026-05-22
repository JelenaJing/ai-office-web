export { getEmailAccount, saveEmailAccount, maskAccount } from './emailStore'
export type { StoredEmailAccount } from './emailStore'
export {
  fetchInbox,
  fetchMessage,
  sendPlainEmail,
  testEmailAccount,
} from './emailMvp'
