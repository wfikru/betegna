import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, base44 } from '@/api/base44Client';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // BYPASS LOGIN: Set default mock user for testing
  const mockUser = {
    uid: 'test-user',
    email: 'test@example.com',
    full_name: 'Test User',
  };

  const [user, setUser] = useState(mockUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // listen for firebase auth state changes (disabled for now with mock user)
  useEffect(() => {
    // const unsub = onAuthStateChanged(auth, (u) => {
    //   setUser(u);
    //   setIsAuthenticated(!!u);
    //   setIsLoadingAuth(false);
    // });
    // return unsub;
  }, []);

  const login = async (email, password) => {
    return base44.auth.signIn(email, password);
  };

  const logout = () => {
    return base44.auth.logout();
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
