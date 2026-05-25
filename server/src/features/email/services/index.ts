export { getEmailAccount, saveEmailAccount, maskAccount } from './emailStore'
export type { StoredEmailAccount } from './emailStore'
export {
  fetchInbox,
  fetchFolder,
  fetchFolderList,
  appendToFolder,
  fetchMessage,
  fetchMessageAttachment,
  sendPlainEmail,
  testEmailAccount,
  testMailboxCredential,
} from './emailMvp'
export { deriveCandidateMailboxes, presetForDomain } from './emailProviderPresets'
export type { CandidateMailbox, EmailProviderPreset } from './emailProviderPresets'
export { autoBindMailboxForUser } from './mailboxAutoBinder'
export type { MailAttachmentContent, MailAttachmentSummary, MailSummary, FetchFolderLog } from './emailMvp'
export {
  buildSalutation,
  createEmailAttachmentArtifact,
  createEmailDraftArtifact,
  resolveDryRunRecipients,
} from './emailArtifacts'
export type { EmailArtifactRelationship } from './emailArtifacts'
export {
  saveFolderMappings,
  getFolderMappings,
  getFolderByRole,
  detectFolderRole,
} from './folderMappingStore'
export type { MailFolderMapping, FolderRole } from './folderMappingStore'
