//src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User as FirebaseUser, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebaseConfig';
import type { Session } from '../types';

interface AuthContextType {
  session: Session;
  userRole: 'admin' | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isOnline: boolean;
}

const defaultSession: Session = {
  user: null,
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextType>({
  session: defaultSession,
  userRole: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  isOnline: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(defaultSession);
  const [userRole, setUserRole] = useState<'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const allowedEmails = import.meta.env.VITE_ALLOWED_EMAILS?.split(',') || [];

  useEffect(() => {
    // Set loading to false immediately to show UI faster
    setLoading(false);
    
    // Add online/offline event listeners
    const handleOnline = () => {
      console.log('Browser is online');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('Browser is offline');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialize Firebase auth after a larger delay
    const timer = setTimeout(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user && allowedEmails.includes(user.email || '')) {
          setSession({
            user: {
              id: user.uid,
              email: user.email || '',
            },
            isAuthenticated: true,
          });
          await handleUserDocument(user);
        } else {
          setSession(defaultSession);
          setUserRole(null);
          if (user) {
            // User not authorized
            alert('Access denied. You are not authorized to use this application.');
            await firebaseSignOut(auth);
          }
        }
      });

      return unsubscribe;
    }, 1000); // Larger delay to let page fully render

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUserDocument = async (user: FirebaseUser) => {
    try {
      // Only try to access Firestore if we have a valid user
      if (!user?.uid) return;
      
      // Check if we're online before attempting Firestore operations
      if (!navigator.onLine) {
        console.log('Offline - skipping Firestore operations');
        setUserRole('admin'); // Default to admin when offline
        return;
      }
      
      // Add a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      );
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDocPromise = getDoc(userDocRef);
      
      const userDoc = await Promise.race([userDocPromise, timeoutPromise]) as any;
      
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role || 'admin');
      } else {
        // Create new user document - everyone is admin
        const newUserData = {
          email: user.email,
          name: user.displayName,
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(userDocRef, newUserData);
        setUserRole('admin');
      }
    } catch (error) {
      // Handle specific Firestore errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('offline') || 
            errorMessage.includes('network') || 
            errorMessage.includes('permission') ||
            errorMessage.includes('unavailable') ||
            errorMessage.includes('timeout')) {
          console.log('Firestore temporarily unavailable:', errorMessage);
        } else {
          console.error('Error handling user document:', error);
        }
      }
      setUserRole('admin'); // Default to admin on error
    }
  };

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setSession(defaultSession);
      setUserRole(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, userRole, loading, signIn, signOut, isOnline }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
