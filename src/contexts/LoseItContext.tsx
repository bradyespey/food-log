import React, { createContext, useContext, useState, useCallback } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebaseConfig'
import { auth } from '../lib/firebaseConfig'

export type LoseItStatus = 'unknown' | 'ok' | 'expired' | 'not_configured'

interface LoseItContextValue {
  status: LoseItStatus
  setStatus: (s: LoseItStatus) => void
  saveCookie: (cookie: string) => Promise<void>
  loadCookie: () => Promise<string | null>
  showSettings: boolean
  openSettings: () => void
  closeSettings: () => void
}

const LoseItContext = createContext<LoseItContextValue | null>(null)

export function LoseItProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus]           = useState<LoseItStatus>('unknown')
  const [showSettings, setShowSettings] = useState(false)

  const openSettings  = useCallback(() => setShowSettings(true),  [])
  const closeSettings = useCallback(() => setShowSettings(false), [])

  const saveCookie = useCallback(async (cookie: string) => {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not signed in')
    await setDoc(doc(db, 'users', uid, 'settings', 'loseit'), {
      cookie,
      updatedAt: serverTimestamp(),
    })
    setStatus('ok')
  }, [])

  const loadCookie = useCallback(async (): Promise<string | null> => {
    const uid = auth.currentUser?.uid
    if (!uid) return null
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'loseit'))
    return (snap.data()?.cookie as string) || null
  }, [])

  return (
    <LoseItContext.Provider value={{ status, setStatus, saveCookie, loadCookie, showSettings, openSettings, closeSettings }}>
      {children}
    </LoseItContext.Provider>
  )
}

export function useLoseIt() {
  const ctx = useContext(LoseItContext)
  if (!ctx) throw new Error('useLoseIt must be used inside LoseItProvider')
  return ctx
}
