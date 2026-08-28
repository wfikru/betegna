import { BRAND } from '../config/brand';

/** "ETB 1,500" */
export function money(amount: number, opts?: { compact?: boolean }): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('en-US');
  if (opts?.compact && rounded >= 1000) {
    return `${BRAND.currency} ${(rounded / 1000).toFixed(rounded >= 10000 ? 0 : 1)}k`;
  }
  return `${BRAND.currency} ${formatted}`;
}

/** ISO date "2026-08-24" → "Mon, Aug 24" */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "2026-08-24" relative to today: Today / Tomorrow / date */
export function relativeDate(iso?: string): string {
  if (!iso) return '—';
  const today = new Date();
  const target = new Date(`${iso}T00:00:00`);
  if (isNaN(target.getTime())) return iso;
  const diffDays = Math.round((target.getTime() - startOfDay(today).getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return formatDate(iso);
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function todayISO(): string {
  return startOfDay(new Date()).toISOString().slice(0, 10);
}

export function addDaysISO(days: number, from = new Date()): string {
  const d = startOfDay(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Milliseconds → "2m ago", "3h ago", "Yesterday", "Aug 12" */
export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(hhmm?: string): string {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** 4.7 km */
export function formatDistance(km?: number): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, eh + em / 60 - (sh + sm / 60));
}

export function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
