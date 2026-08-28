/**
 * Betegna brand & market configuration.
 * Ethiopia-first marketplace: ETB currency, Addis Ababa service areas, EN/አማ bilingual.
 */
/** Bumped on every artifact build — shown in Profile so you can instantly
 *  tell which build a device is actually running (stale-bundle detector). */
export const BUILD_ID = '2026.08.27.14';

export const BRAND = {
  name: 'Betegna',
  nameAm: 'ቤተኛ',
  tagline: 'Tell us what you need — we will get it done.',
  taglineAm: 'የሚያስፈልግዎትን ይንገሩን — እኛ እናጠናቅቃለን።',
  city: 'Addis Ababa',
  country: 'Ethiopia',
  currency: 'ETB',
  scheme: 'betegna',
  deepLinkHost: 'betegna.app',
} as const;

export type PriceUnit = 'hour' | 'visit' | 'sqm' | 'flat' | 'day' | 'month' | 'bag';

export const PRICE_UNIT_LABEL: Record<PriceUnit, string> = {
  hour: '/hr',
  visit: '/visit',
  sqm: '/m²',
  flat: '/job',
  day: '/day',
  month: '/mo',
  bag: '/bag',
};
