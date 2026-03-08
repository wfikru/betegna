import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, api } from '@/api/firebaseClient';
import {
  onAuthStateChanged,
  getRedirectResult,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
} from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // default state; will be replaced when real auth is enabled
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // listen for firebase auth state changes and keep context in sync
  useEffect(() => {
    const configurePersistence = async () => {
      // Progressive fallback for web + mobile webviews.
      // iOS WKWebView can occasionally reject one strategy depending on device state.
      const strategies = [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ];

      for (const strategy of strategies) {
        try {
          await setPersistence(auth, strategy);
          return;
        } catch (err) {
          console.warn('Auth persistence setup failed for strategy, trying next:', err?.message || err);
        }
      }
    };

    configurePersistence();

    // Resolve redirect-based Google sign-in results (mobile flow)
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
    }).catch((err) => {
      if (err) {
        console.warn('Google redirect sign-in result error:', err?.code || err?.message || err);
      }
    });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthenticated(!!u);
      setIsLoadingAuth(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    return api.auth.signIn(email, password);
  };

  const signup = async (email, password, firstName, lastName) => {
    return api.auth.signUp(email, password, firstName, lastName);
  };

  const loginWithGoogle = async () => {
    return api.auth.signInWithGoogle();
  };

  const logout = () => {
    return api.auth.logout();
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      login,
      signup,
      loginWithGoogle,
      logout,
      navigateToLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
