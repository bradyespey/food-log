// Firebase entry-point for the mobile app.
// Uses EXPO_PUBLIC_* env vars and React-Native AsyncStorage auth persistence.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// getReactNativePersistence is available in the RN bundle at runtime but
// not in the TypeScript typings of firebase/auth. Use a runtime require.
let auth: Auth;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getReactNativePersistence } = require('firebase/auth') as {
    getReactNativePersistence: (storage: unknown) => unknown;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) } as any);
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
