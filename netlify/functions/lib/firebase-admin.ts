import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

interface AdminServices { db: Firestore; auth: Auth }

// Lazy init — returns null if FIREBASE_SERVICE_ACCOUNT is not set or invalid.
// food-log.ts falls back to LOSEIT_COOKIE env var in that case.
function tryInitAdmin(): AdminServices | null {
  try {
    const existing = getApps()
    if (existing.length > 0) {
      return { db: getFirestore(existing[0]), auth: getAuth(existing[0]) }
    }
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim()
    if (!raw) return null
    const serviceAccount = JSON.parse(raw)
    const app = initializeApp({ credential: cert(serviceAccount) })
    return { db: getFirestore(app), auth: getAuth(app) }
  } catch {
    return null
  }
}

export async function getLoseItCookie(authHeader: string | undefined): Promise<string | null> {
  const services = tryInitAdmin()
  if (!services || !authHeader?.startsWith('Bearer ')) return null
  try {
    const token   = authHeader.slice(7)
    const decoded = await services.auth.verifyIdToken(token)
    const doc     = await services.db.doc(`users/${decoded.uid}/settings/loseit`).get()
    return (doc.data()?.cookie as string) || null
  } catch {
    return null
  }
}
