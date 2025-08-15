//src/lib/firebaseConfig.ts

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Lazy initialize Firebase to improve initial load time
let app: any = null;
let auth: any = null;
let googleProvider: any = null;
let db: any = null;

export const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
  }
  return { app, auth, googleProvider, db };
};

export const getAuthInstance = () => {
  if (!auth) initializeFirebase();
  return auth;
};

export const getGoogleProvider = () => {
  if (!googleProvider) initializeFirebase();
  return googleProvider;
};

export const getDbInstance = () => {
  if (!db) initializeFirebase();
  return db;
};

// For backward compatibility
export { auth, googleProvider, db };
export default app;
