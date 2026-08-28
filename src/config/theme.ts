/**
 * Betegna design system tokens.
 * Original system: deep green trust + warm gold accent, generous whitespace,
 * rounded cards, subtle shadows. Light & dark palettes, WCAG-minded contrast.
 */
import { Appearance } from 'react-native';

export interface Palette {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  skeleton: string;
  overlay: string;
  star: string;
}

export const lightPalette: Palette = {
  primary: '#0B6B45',
  primaryDark: '#085135',
  primarySoft: '#E4F1E9',
  onPrimary: '#FFFFFF',
  accent: '#C77F02',
  accentSoft: '#FBF0D9',
  onAccent: '#3D2A00',
  background: '#FAF6EE', // warm cream — cards float on it
  surface: '#FFFFFF',
  surfaceAlt: '#F3EDDF',
  border: '#E8E0CF',
  text: '#1C2A23',
  textMuted: '#6E7B71',
  textInverse: '#FFFFFF',
  success: '#0F7B4F',
  warning: '#B45309',
  danger: '#C0392B',
  info: '#32669B',
  skeleton: '#EFE8DA',
  overlay: 'rgba(38, 30, 16, 0.55)',
  star: '#E8A317',
};

export const darkPalette: Palette = {
  primary: '#3BAB7F',
  primaryDark: '#0B6B45',
  primarySoft: '#153526',
  onPrimary: '#08120D',
  accent: '#F0B429',
  accentSoft: '#3A2E10',
  onAccent: '#FFE9BE',
  background: '#131009', // warm near-black
  surface: '#1E1A12',
  surfaceAlt: '#282216',
  border: '#332C1E',
  text: '#F2EDE2',
  textMuted: '#A8A290',
  textInverse: '#131009',
  success: '#3BC98D',
  warning: '#E8A317',
  danger: '#E8756A',
  info: '#6BA6DE',
  skeleton: '#262015',
  overlay: 'rgba(0, 0, 0, 0.65)',
  star: '#F0B429',
};

/** hex (#RRGGBB) + alpha -> rgba() string */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 13, lg: 18, xl: 24, full: 999 } as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.6 },
  h1: { fontSize: 24, lineHeight: 31, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2: { fontSize: 19, lineHeight: 25, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 11.5, lineHeight: 15, fontWeight: '500' as const },
};

export type ThemeMode = 'light' | 'dark' | 'system';

export function resolvePalette(mode: ThemeMode): Palette {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? darkPalette : lightPalette;
  }
  return mode === 'dark' ? darkPalette : lightPalette;
}

export const shadow = {
  // soft & layered: low opacity, wide radius — cards float on the cream bg
  sm: { shadowColor: '#2A2118', shadowOpacity: 0.045, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  md: { shadowColor: '#2A2118', shadowOpacity: 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
};

/** tabular figures for money/counters (stops digit wobble) */
export const TABULAR = { fontVariant: ['tabular-nums'] as ('tabular-nums')[] };
