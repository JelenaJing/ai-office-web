/**
 * passwordCrypto.ts — Safe email password storage helper
 *
 * Strategy:
 *  - If EMAIL_SECRET env var is set: AES-256-GCM encrypt/decrypt
 *  - If not set in production: refuse to save plaintext (throw)
 *  - If not set in development: warn and store as-is (backwards-compat)
 *
 * Stored format: `enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>`
 * Plain (dev-only): raw string without the `enc:` prefix
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const ENC_PREFIX = 'enc:v1:'

function deriveKey(secret: string): Buffer {
  // Derive a fixed 32-byte key from the secret using scrypt
  return scryptSync(secret, 'aios-email-salt', 32)
}

/**
 * Encrypt a plaintext password.
 * @throws In production when EMAIL_SECRET is not configured.
 */
export function encryptPassword(plaintext: string): string {
  const secret = process.env.EMAIL_SECRET
  if (!secret) {
    if (IS_PRODUCTION) {
      throw new Error(
        'EMAIL_SECRET env var is required in production to encrypt email passwords. ' +
        'Set EMAIL_SECRET to a long random string.',
      )
    }
    // Dev: store as-is with a warning
    console.warn('[passwordCrypto] EMAIL_SECRET not set — storing email password in plaintext (dev only)')
    return plaintext
  }

  const key = deriveKey(secret)
  const iv = randomBytes(12) // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${ENC_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypt a stored password value.
 * Returns the original plaintext regardless of whether it was encrypted.
 */
export function decryptPassword(stored: string): string {
  if (!stored.startsWith(ENC_PREFIX)) {
    // Plaintext (legacy dev storage or pre-encryption)
    return stored
  }

  const secret = process.env.EMAIL_SECRET
  if (!secret) {
    throw new Error(
      'EMAIL_SECRET env var is required to decrypt stored email passwords. ' +
      'Set EMAIL_SECRET to the same value used when the password was saved.',
    )
  }

  const rest = stored.slice(ENC_PREFIX.length)
  const parts = rest.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted password format')
  }
  const [ivHex, tagHex, ciphertextHex] = parts
  const key = deriveKey(secret)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
