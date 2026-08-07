#!/usr/bin/env node
/**
 * Firestore Backup Script
 * Encrypts and commits Firestore data to the repo.
 * Run via GitHub Actions weekly.
 *
 * FoodLog stores everything under per-user subcollections, so this backs up
 * the top-level `users` docs plus the `settings` and `mealDrafts` subcollections
 * via collectionGroup queries (keyed by full doc path to avoid id collisions
 * across users).
 *
 * Usage (manual): node scripts/backup.js
 * Required env vars: FIREBASE_SERVICE_ACCOUNT, BACKUP_ENCRYPTION_KEY
 */

import { createCipheriv, randomBytes } from 'crypto'
import { writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = join(__dirname, '..', 'data-backups')
const COLLECTIONS = ['users']
const COLLECTION_GROUPS = ['settings', 'mealDrafts']
const RETENTION_DAYS = 90

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}')
  initializeApp({ credential: cert(serviceAccount) })
}

const db = getFirestore()

async function fetchAllData() {
  const data = {}

  for (const col of COLLECTIONS) {
    const snapshot = await db.collection(col).get()
    data[col] = {}
    snapshot.docs.forEach((doc) => {
      data[col][doc.id] = doc.data()
    })
    console.log(`  ${col}: ${snapshot.size} documents`)
  }

  for (const group of COLLECTION_GROUPS) {
    const snapshot = await db.collectionGroup(group).get()
    data[group] = {}
    snapshot.docs.forEach((doc) => {
      data[group][doc.ref.path] = doc.data()
    })
    console.log(`  ${group} (collectionGroup): ${snapshot.size} documents`)
  }

  return data
}

function encrypt(plaintext, key) {
  const iv = randomBytes(16)
  const keyBuf = Buffer.from(key, 'base64').slice(0, 32)
  const cipher = createCipheriv('aes-256-gcm', keyBuf, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Store as one base64 blob (IV + authTag + ciphertext) to avoid secret scanners
  // misreading JSON envelope fields like "authTag" as leaked credentials.
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

function cleanOldBackups() {
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.encrypted.json'))
    .map((f) => ({ name: f, path: join(BACKUP_DIR, f), date: new Date(f.split('-backup')[0]) }))
    .sort((a, b) => b.date - a.date)

  if (files.length === 0) return

  const mostRecent = files[0]
  const daysSinceMostRecent = (Date.now() - mostRecent.date) / (1000 * 60 * 60 * 24)

  if (daysSinceMostRecent > RETENTION_DAYS) {
    console.log('⚠ Most recent backup is older than retention period — skipping cleanup to prevent data loss')
    return
  }

  const toDelete = files.filter((f) => (Date.now() - f.date) / (1000 * 60 * 60 * 24) > RETENTION_DAYS)
  for (const f of toDelete) {
    unlinkSync(f.path)
    console.log(`  Deleted old backup: ${f.name}`)
  }
}

async function main() {
  const key = process.env.BACKUP_ENCRYPTION_KEY
  if (!key) throw new Error('BACKUP_ENCRYPTION_KEY is required')

  console.log('Fetching Firestore data…')
  const data = await fetchAllData()

  const allKeys = [...COLLECTIONS, ...COLLECTION_GROUPS]
  const payload = {
    timestamp: new Date().toISOString(),
    project: 'foodlog',
    collections: Object.fromEntries(allKeys.map((c) => [c, Object.keys(data[c] ?? {}).length])),
    data,
  }

  console.log('Encrypting…')
  const encrypted = encrypt(JSON.stringify(payload), key)

  const date = new Date().toISOString().split('T')[0]
  const filename = `${date}-backup.encrypted.json`
  writeFileSync(join(BACKUP_DIR, filename), encrypted)
  console.log(`✓ Backup saved: data-backups/${filename}`)

  cleanOldBackups()
}

main().catch((err) => {
  console.error('Backup failed:', err)
  process.exit(1)
})
