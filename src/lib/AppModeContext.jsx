import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppModeContext = createContext(null);

export function AppModeProvider({ children }) {
  const { user } = useAuth();
  
  const [mode, setModeState] = useState(() => {
    const saved = localStorage.getItem('betegna-app-mode');
    return saved === 'tasker' ? 'tasker' : 'client';
  });

  // Keep html / body attribute in sync for global CSS styling & dark/light mode compliance
  useEffect(() => {
    document.documentElement.setAttribute('data-app-mode', mode);
    localStorage.setItem('betegna-app-mode', mode);
  }, [mode]);

  const toggleMode = (forcedMode) => {
    if (typeof forcedMode === 'string') {
      setModeState(forcedMode);
    } else {
      setModeState(prev => (prev === 'client' ? 'tasker' : 'client'));
    }
  };

  const isTaskerMode = mode === 'tasker';
  const isClientMode = mode === 'client';

  const themeTokens = isTaskerMode
    ? {
        name: 'Tasker Business Dashboard',
        primaryBg: 'bg-indigo-950',
        primaryText: 'text-indigo-400',
        accentBg: 'bg-teal-600',
        accentText: 'text-teal-400',
        headerGrad: 'from-indigo-950 via-indigo-900 to-teal-900',
        badgeBg: 'bg-indigo-900/80 text-indigo-200 border-indigo-700',
        border: 'border-indigo-800/60',
      }
    : {
        name: 'Client Marketplace',
        primaryBg: 'bg-slate-900',
        primaryText: 'text-slate-900',
        accentBg: 'bg-emerald-600',
        accentText: 'text-emerald-700',
        headerGrad: 'from-slate-900 via-slate-800 to-emerald-950',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        border: 'border-slate-200/80',
      };

  return (
    <AppModeContext.Provider
      value={{
        mode,
        isTaskerMode,
        isClientMode,
        toggleMode,
        themeTokens,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}
