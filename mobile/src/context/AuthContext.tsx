// src/context/AuthContext.tsx
// Mirrors web src/context/AuthContext.tsx in spirit: holds the Firebase user,
// exposes signIn/signOut, and enforces the same email whitelist as the web app.

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithCredential,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth, db } from '../lib/firebase';

WebBrowser.maybeCompleteAuthSession();

const ALLOWED = (process.env.EXPO_PUBLIC_ALLOWED_EMAILS || '')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // expo-auth-session Google flow. iosClientId is used on iOS; webClientId is
  // used to mint Firebase credentials.
  const [, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Watch Firebase auth state.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (ALLOWED.length > 0 && !ALLOWED.includes(u.email || '')) {
          setError('Access denied. This Google account is not authorized.');
          await fbSignOut(auth);
          setUser(null);
        } else {
          setUser(u);
          // Fire-and-forget user-doc bootstrap (matches web behaviour).
          void ensureUserDoc(u);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Handle the Google response: when we get an id_token back, hand it to Firebase.
  useEffect(() => {
    if (!response) return;
    if (response.type !== 'success') {
      if (response.type === 'error') {
        setError(response.error?.message || 'Google sign-in failed');
      }
      setSigningIn(false);
      return;
    }
    const idToken = response.authentication?.idToken || response.params?.id_token;
    if (!idToken) {
      setError('Google did not return an ID token');
      setSigningIn(false);
      return;
    }
    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(auth, credential)
      .catch((e: Error) => setError(e.message))
      .finally(() => setSigningIn(false));
  }, [response]);

  const signIn = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    try {
      await promptAsync();
    } catch (e) {
      setError((e as Error).message);
      setSigningIn(false);
    }
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, signingIn, error, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

async function ensureUserDoc(u: FirebaseUser): Promise<void> {
  try {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: u.email,
        name: u.displayName,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
    }
  } catch {
    // Non-fatal — the web app handles this on next sign-in.
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
