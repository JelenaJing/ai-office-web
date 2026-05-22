export { getEmailAccount, saveEmailAccount, maskAccount } from './emailStore'
export type { StoredEmailAccount } from './emailStore'
export {
  fetchInbox,
  fetchMessage,
  fetchMessageAttachment,
  sendPlainEmail,
  testEmailAccount,
} from './emailMvp'
export type { MailAttachmentContent, MailAttachmentSummary, MailSummary } from './emailMvp'
export {
  buildSalutation,
  createEmailAttachmentArtifact,
  createEmailDraftArtifact,
  resolveDryRunRecipients,
} from './emailArtifacts'
export type { EmailArtifactRelationship } from './emailArtifacts'
