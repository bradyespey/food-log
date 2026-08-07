#!/usr/bin/env node
/**
 * Decrypt a backup file produced by backup.js
 *
 * Usage:
 *   export BACKUP_ENCRYPTION_KEY="your-key"
 *   node scripts/decrypt-backup.js data-backups/2025-01-01-backup.encrypted.json
 */

import { createDecipheriv } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/decrypt-backup.js <path-to-encrypted-file>')
  process.exit(1)
}

const key = process.env.BACKUP_ENCRYPTION_KEY
if (!key) {
  console.error('BACKUP_ENCRYPTION_KEY env var is required')
  process.exit(1)
}

const keyBuf = Buffer.from(key, 'base64').slice(0, 32)
const raw = readFileSync(file, 'utf8').trim()

function decryptBase64Envelope(base64Value) {
  const encryptedBuffer = Buffer.from(base64Value, 'base64')
  const iv = encryptedBuffer.slice(0, 16)
  const authTag = encryptedBuffer.slice(16, 32)
  const encrypted = encryptedBuffer.slice(32)

  const decipher = createDecipheriv('aes-256-gcm', keyBuf, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8')
}

function decryptLegacyJsonEnvelope(jsonValue) {
  const { iv, authTag, data } = JSON.parse(jsonValue)
  const decipher = createDecipheriv('aes-256-gcm', keyBuf, Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(data, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

const decrypted = raw.startsWith('{')
  ? decryptLegacyJsonEnvelope(raw)
  : decryptBase64Envelope(raw)

const outFile = file.replace('.encrypted.json', '.decrypted.json')
writeFileSync(outFile, JSON.stringify(JSON.parse(decrypted), null, 2))
console.log(`✓ Decrypted to: ${outFile}`)
