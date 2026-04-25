import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function initAdmin() {
  if (getApps().length > 0) return getApps()[0]
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set')
  const serviceAccount = JSON.parse(raw)
  return initializeApp({ credential: cert(serviceAccount) })
}

const app  = initAdmin()
export const adminDb   = getFirestore(app)
export const adminAuth = getAuth(app)

export async function getLoseItCookie(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const token   = authHeader.slice(7)
    const decoded = await adminAuth.verifyIdToken(token)
    const doc     = await adminDb.doc(`users/${decoded.uid}/settings/loseit`).get()
    return (doc.data()?.cookie as string) || null
  } catch {
    return null
  }
}
