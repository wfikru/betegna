/** Quote math — single source of truth for quote totals (server mirrors this in Cloud Functions). */
import type { QuoteLineItem } from '../../models/types';

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export function computeQuoteTotals(
  lines: QuoteLineItem[],
  discount: number,
  taxPct: number,
): QuoteTotals {
  const cleanLines = lines
    .map((l) => ({ ...l, amount: Math.max(0, Number(l.amount) || 0) }))
    .filter((l) => l.label.trim().length > 0 && l.amount > 0);
  const rawSubtotal = cleanLines.reduce((s, l) => s + l.amount, 0);
  const subtotal = round2(rawSubtotal);
  const discountAmount = round2(Math.min(Math.max(0, Number(discount) || 0), subtotal));
  const taxable = subtotal - discountAmount;
  const pct = Math.min(Math.max(0, Number(taxPct) || 0), 30);
  const tax = round2((taxable * pct) / 100);
  return { subtotal, discount: discountAmount, tax, total: round2(taxable + tax) };
}

/** Platform fee (Phase 3 monetization; demo shows it in pro earnings). */
export function platformFee(total: number, pct = 12): number {
  return round2((total * pct) / 100);
}

export function proNetEarnings(total: number, pct = 12): number {
  return round2(total - platformFee(total, pct));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
