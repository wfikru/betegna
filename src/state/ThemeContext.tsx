import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Palette } from '../config/theme';
import { lightPalette, spacing, radius, typography, shadow, type ThemeMode } from '../config/theme';

export type { ThemeMode };

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  palette: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadow: typeof shadow;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<Theme | null>(null);

// Betegna ships LIGHT-ONLY by design; the mode plumbing stays so a dark
// theme can be reintroduced later without touching screens.

const THEME_KEY = 'betegna-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode] = useState<ThemeMode>('light');


  const value = useMemo<Theme>(() => {
    const palette = lightPalette;
    const isDark = false;
    return {
      mode,
      isDark,
      palette,
      spacing,
      radius,
      typography,
      shadow,
      setMode: () => undefined,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme outside ThemeProvider');
  return ctx;
}

export { lightPalette };
