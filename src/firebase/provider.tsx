'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Función para inicializar Firebase de forma segura
function getFirebaseServices() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  let app: FirebaseApp;
  
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const firestoreInstance = getFirestore(app);
  const authInstance = getAuth(app);

  return {
    firebaseApp: app,
    firestore: firestoreInstance,
    auth: authInstance,
  };
}

interface FirebaseProviderProps {
  children: ReactNode;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  isCartSheetOpen: boolean;
  openCartSheet: () => void;
  closeCartSheet: () => void;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  // Inicializar servicios de Firebase en el estado
  const [services] = useState(() => getFirebaseServices());
  
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });
  
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const openCartSheet = () => setIsCartSheetOpen(true);
  const closeCartSheet = () => setIsCartSheetOpen(false);

  useEffect(() => {
    if (!services.auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null });

    const unsubscribe = onAuthStateChanged(
      services.auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [services.auth]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(services.firebaseApp && services.firestore && services.auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? services.firebaseApp : null,
      firestore: servicesAvailable ? services.firestore : null,
      auth: servicesAvailable ? services.auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      isCartSheetOpen,
      openCartSheet,
      closeCartSheet,
    };
  }, [services, userAuthState, isCartSheetOpen]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  return context;
};

export const useAuth = (): Auth | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider.');
  }
  return context.auth;
};

export const useFirestore = (): Firestore | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider.');
  }
  return context.firestore;
};

export const useFirebaseApp = (): FirebaseApp | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider.');
  }
  return context.firebaseApp;
};
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  
  const { user, isUserLoading, userError } = context;
  
  const memoizedUser = useMemo(() => {
    return isUserLoading ? null : user;
  }, [isUserLoading, user]);

  return { user: memoizedUser, isUserLoading, userError };
};

export const useUI = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a FirebaseProvider.');
  }
  return { 
    isCartSheetOpen: context.isCartSheetOpen, 
    openCartSheet: context.openCartSheet, 
    closeCartSheet: context.closeCartSheet 
  };
};