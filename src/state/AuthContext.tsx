import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppUser, UserRole } from '../models/types';
import * as authService from '../services/auth';
import * as chatService from '../services/chat';
import { setLocale } from '../i18n';
import { setRoleLanding } from './roleLanding';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  /** customer ⇄ professional shell switch (one account, both roles) */
  activeRole: UserRole;
  switchRole: (role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUser: (patch: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = authService.onAuthStateChanged((u) => {
      setUser(u);
      if (u) setLocale(u.locale);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await authService.signIn(email, password);
    setUser(u);
    setLocale(u.locale);
  }, []);

  const signUp = useCallback(async (input: { name: string; email: string; password: string; role: UserRole }) => {
    const u = await authService.signUp(input);
    setUser(u);
    setLocale(u.locale);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const switchRole = useCallback(
    async (role: UserRole) => {
      if (!user) return;
      // the shell remounts on role change — tell the fresh tab navigator
      // which tab to open on (deterministic landing, no history rehydration)
      setRoleLanding(role === 'professional' ? 'ProProfileTab' : 'ProfileTab');
      const updated = await authService.switchActiveRole(user, role);
      if (updated) setUser(updated);
    },
    [user],
  );

  const updateUser = useCallback(
    async (patch: Partial<AppUser>) => {
      if (!user) return;
      const updated = await authService.updateUser(user.uid, patch);
      if (updated) {
        setUser(updated);
        if (patch.locale) setLocale(patch.locale);
      }
    },
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      activeRole: user?.activeRole ?? 'customer',
      switchRole,
      signIn,
      signUp,
      signOut,
      sendPasswordReset: authService.sendPasswordReset,
      updateUser,
    }),
    [user, loading, switchRole, signIn, signUp, signOut],
  );

  void chatService; // chat service imported lazily by screens
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
