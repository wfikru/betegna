import { am } from './am';
import { en } from './en';
import type { Locale } from '../models/types';

export type Dict = Record<string, string>;

const dicts: Record<Locale, Dict> = { en, am };

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/** Translate a dot-path key with optional {placeholders}. Falls back to English, then the key. */
export function t(key: string, params?: Record<string, string | number>): string {
  const raw = dicts[currentLocale][key] ?? dicts.en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? `{${p}}`));
}
