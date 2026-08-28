/**
 * Payment flow — pure business logic (unit-tested, UI-free).
 * Mirrors the authoritative state machine in Cloud Functions (functions/payments).
 */
import type { Booking, PaymentRecord, PaymentStatus } from '../../models/types';
import { getPaymentProvider, DEFAULT_PROVIDER } from './providers';

/* ── status machine ──
 * pending    → processing (digital: user redirected to provider)
 * pending    → cancelled  (user aborted / chose another method)
 * processing → held       (provider confirmed capture — escrow)
 * processing → failed     (provider timeout / declined)
 * held       → released   (job completed & confirmed → payout to pro)
 * held       → refunded   (dispute resolved in customer's favour)
 * pending(cash) → released (pro confirms cash collection on completion)
 * any        → failed (terminal, with failureReason)
 */
const TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['processing', 'released', 'cancelled', 'failed'],
  processing: ['held', 'failed', 'cancelled'],
  held: ['released', 'refunded'],
  released: [],
  refunded: [],
  cancelled: [],
  failed: [],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** A booking needs payment when work is done and nothing has been released. */
export function needsPayment(booking: Pick<Booking, 'status' | 'paid'>): boolean {
  return (
    (booking.status === 'in_progress' || booking.status === 'completed') && !booking.paid
  );
}

/** Digital providers capture+hold up front; cash is collected on completion. */
export function releaseTrigger(status: PaymentStatus, method: PaymentRecord['method']): 'on_capture' | 'on_completion' {
  if (method === 'cash') return 'on_completion';
  return status === 'held' ? 'on_completion' : 'on_capture';
}

export interface PaymentIntentInput {
  booking: Pick<Booking, 'id' | 'requestId' | 'customerId' | 'proId' | 'total'>;
  providerId?: string;
  payerUid: string;
}

/** Build a new payment record (client-side draft; Functions re-validate every field). */
export function buildPaymentIntent(input: PaymentIntentInput): PaymentRecord {
  const provider = getPaymentProvider(input.providerId ?? DEFAULT_PROVIDER);
  if (!provider) throw new Error(`Unknown payment provider: ${input.providerId}`);
  const now = Date.now();
  return {
    id: `pay_${input.booking.id}_${provider.id}`,
    bookingId: input.booking.id,
    requestId: input.booking.requestId,
    payerUid: input.payerUid,
    payeeUid: input.booking.proId,
    amount: input.booking.total,
    currency: 'ETB',
    provider: provider.id,
    method: provider.kind === 'digital' ? 'digital' : 'cash',
    status: 'pending',
    initiatedAt: now,
    updatedAt: now,
  };
}

/** What the customer still owes given all attempts for this booking. */
export function outstandingAmount(booking: Pick<Booking, 'id' | 'total' | 'paid'>, payments: PaymentRecord[]): number {
  if (booking.paid) return 0;
  const active = payments.filter(
    (p) => p.bookingId === booking.id && ['pending', 'processing', 'held', 'released'].includes(p.status),
  );
  return active.length ? 0 : booking.total;
}

/** Human-readable status label + tone used by badges across the app. */
export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }> = {
  pending: { label: 'Awaiting payment', tone: 'warning' },
  processing: { label: 'Confirming with Telebirr…', tone: 'info' },
  held: { label: 'Held in escrow', tone: 'info' },
  released: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

/** Pro-side earnings count only released payments. */
export function isCountedAsEarning(p: PaymentRecord): boolean {
  return p.status === 'released';
}
