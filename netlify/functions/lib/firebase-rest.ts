interface AccountLookupResponse {
  users?: Array<{ localId?: string }>
}

interface FirestoreStringValue {
  stringValue?: string
}

interface FirestoreDocument {
  fields?: {
    cookie?: FirestoreStringValue
  }
}

const FIREBASE_IDENTITY_BASE = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup'
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1'

async function getUidFromIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY?.trim()
  if (!apiKey) return null

  try {
    const response = await fetch(`${FIREBASE_IDENTITY_BASE}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })

    if (!response.ok) return null

    const data = await response.json() as AccountLookupResponse
    return data.users?.[0]?.localId || null
  } catch (error) {
    console.error('Firebase token lookup failed:', error)
    return null
  }
}

export async function getLoseItCookie(authHeader: string | undefined): Promise<string | null> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim()
  if (!projectId || !authHeader?.startsWith('Bearer ')) return null

  const idToken = authHeader.slice(7)
  const uid = await getUidFromIdToken(idToken)
  if (!uid) return null

  try {
    const documentPath = `projects/${projectId}/databases/(default)/documents/users/${uid}/settings/loseit`
    const response = await fetch(`${FIRESTORE_BASE}/${documentPath}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })

    if (!response.ok) return null

    const data = await response.json() as FirestoreDocument
    return data.fields?.cookie?.stringValue || null
  } catch (error) {
    console.error('Firebase cookie lookup failed:', error)
    return null
  }
}
