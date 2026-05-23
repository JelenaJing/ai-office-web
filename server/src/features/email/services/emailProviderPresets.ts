export type EmailProviderId =
  | 'school-cuhk'
  | 'microsoft-365'
  | 'internal-mailcow'
  | 'netease-163'
  | 'custom'

export type TlsMode = 'ssl' | 'starttls' | 'none'

export interface EmailProviderPreset {
  provider: EmailProviderId
  label: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  imapTlsMode: TlsMode
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpTlsMode: TlsMode
  allowSelfSignedCerts?: boolean
  usernamePolicy: 'full_email'
}

export interface CandidateMailbox extends EmailProviderPreset {
  email: string
  domain: string
  priority: number
}

function envString(name: string, fallback: string): string {
  return process.env[name] || fallback
}

function envNumber(name: string, fallback: number): number {
  const raw = Number(process.env[name])
  return Number.isFinite(raw) && raw > 0 ? raw : fallback
}

export function presetForDomain(domain: string): EmailProviderPreset {
  const normalized = domain.toLowerCase()
  if (normalized === 'cuhk.edu.cn') {
    return {
      provider: 'school-cuhk',
      label: 'CUHK 教职工邮箱',
      imapHost: envString('CUHK_IMAP_HOST', 'mail.cuhk.edu.cn'),
      imapPort: envNumber('CUHK_IMAP_PORT', 143),
      imapSecure: process.env.CUHK_IMAP_SECURE === 'true',
      imapTlsMode: (process.env.CUHK_IMAP_TLS_MODE as TlsMode) || 'starttls',
      smtpHost: envString('CUHK_SMTP_HOST', 'mail.cuhk.edu.cn'),
      smtpPort: envNumber('CUHK_SMTP_PORT', 587),
      smtpSecure: process.env.CUHK_SMTP_SECURE === 'true',
      smtpTlsMode: (process.env.CUHK_SMTP_TLS_MODE as TlsMode) || 'starttls',
      allowSelfSignedCerts: process.env.CUHK_ALLOW_SELF_SIGNED_CERTS !== 'false',
      usernamePolicy: 'full_email',
    }
  }
  if (normalized === 'link.cuhk.edu.cn') {
    return {
      provider: 'microsoft-365',
      label: 'Microsoft 365 / Outlook',
      imapHost: envString('LINK_CUHK_IMAP_HOST', 'outlook.office365.com'),
      imapPort: envNumber('LINK_CUHK_IMAP_PORT', 993),
      imapSecure: true,
      imapTlsMode: 'ssl',
      smtpHost: envString('LINK_CUHK_SMTP_HOST', 'smtp.office365.com'),
      smtpPort: envNumber('LINK_CUHK_SMTP_PORT', 587),
      smtpSecure: false,
      smtpTlsMode: 'starttls',
      usernamePolicy: 'full_email',
    }
  }
  if (normalized === 'ai.cuhk.edu.cn') {
    return {
      provider: 'internal-mailcow',
      label: 'AI Office 内部邮箱',
      imapHost: envString('INTERNAL_IMAP_HOST', envString('INTERNAL_MAIL_HOST', '10.20.5.61')),
      imapPort: envNumber('INTERNAL_IMAP_PORT', 993),
      imapSecure: process.env.INTERNAL_IMAP_SECURE !== 'false',
      imapTlsMode: process.env.INTERNAL_IMAP_SECURE === 'false' ? 'starttls' : 'ssl',
      smtpHost: envString('INTERNAL_SMTP_HOST', envString('INTERNAL_MAIL_HOST', '10.20.5.61')),
      smtpPort: envNumber('INTERNAL_SMTP_PORT', 465),
      smtpSecure: process.env.INTERNAL_SMTP_SECURE !== 'false',
      smtpTlsMode: process.env.INTERNAL_SMTP_SECURE === 'false' ? 'starttls' : 'ssl',
      allowSelfSignedCerts: process.env.INTERNAL_MAIL_ALLOW_SELF_SIGNED_CERTS !== 'false',
      usernamePolicy: 'full_email',
    }
  }
  if (normalized === '163.com') {
    return {
      provider: 'netease-163',
      label: '网易 163 邮箱',
      imapHost: 'imap.163.com',
      imapPort: 993,
      imapSecure: true,
      imapTlsMode: 'ssl',
      smtpHost: 'smtp.163.com',
      smtpPort: 465,
      smtpSecure: true,
      smtpTlsMode: 'ssl',
      usernamePolicy: 'full_email',
    }
  }
  return {
    provider: 'custom',
    label: '自定义邮箱',
    imapHost: envString('CUSTOM_IMAP_HOST', `imap.${normalized}`),
    imapPort: envNumber('CUSTOM_IMAP_PORT', 993),
    imapSecure: process.env.CUSTOM_IMAP_SECURE !== 'false',
    imapTlsMode: process.env.CUSTOM_IMAP_SECURE === 'false' ? 'starttls' : 'ssl',
    smtpHost: envString('CUSTOM_SMTP_HOST', `smtp.${normalized}`),
    smtpPort: envNumber('CUSTOM_SMTP_PORT', 465),
    smtpSecure: process.env.CUSTOM_SMTP_SECURE !== 'false',
    smtpTlsMode: process.env.CUSTOM_SMTP_SECURE === 'false' ? 'starttls' : 'ssl',
    usernamePolicy: 'full_email',
  }
}

export function deriveCandidateMailboxes(inputLogin: string): CandidateMailbox[] {
  const raw = String(inputLogin || '').trim().toLowerCase()
  if (!raw) return []
  const emails = raw.includes('@')
    ? [raw]
    : [`${raw}@cuhk.edu.cn`, `${raw}@link.cuhk.edu.cn`, `${raw}@ai.cuhk.edu.cn`]
  return emails.map((email, index) => {
    const domain = email.split('@')[1] || ''
    return {
      ...presetForDomain(domain),
      email,
      domain,
      priority: index + 1,
    }
  })
}
