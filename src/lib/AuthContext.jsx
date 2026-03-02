import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, api } from '@/api/firebaseClient';
import {
  onAuthStateChanged,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // default state; will be replaced when real auth is enabled
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // listen for firebase auth state changes and keep context in sync
  useEffect(() => {
    // Ensure auth state survives redirects/reloads, especially on mobile browsers
    setPersistence(auth, browserLocalPersistence).catch(async (err) => {
      console.warn('Failed to set local auth persistence, falling back to session:', err?.message || err);
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (err2) {
        console.warn('Failed to set session auth persistence:', err2?.message || err2);
      }
    });

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
