/**
 * Refunds & cancellation policy — pure logic, mirrored in Cloud Functions.
 * Policy values are configuration, not business rules scattered in screens.
 */
import type { Booking, PaymentRecord } from '../../models/types';

export interface CancellationPolicy {
  /** cancelling more than this many hours before the start is free */
  freeCancelHours: number;
  /** late cancellation: this % of a held payment goes to the professional */
  lateFeePct: number;
  /** platform fee taken from released payments (monetization, configurable) */
  platformFeePct: number;
}

export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  freeCancelHours: 24,
  lateFeePct: 10,
  platformFeePct: 12,
};

export type CancellationOutcome = {
  kind: 'free' | 'late' | 'after_start' | 'no_payment';
  /** fraction of held funds returned to the customer (0..1) */
  refundPct: number;
  label: string;
};

export function cancellationOutcome(
  booking: Pick<Booking, 'status' | 'scheduledAt'>,
  policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY,
): CancellationOutcome {
  if (booking.status !== 'cancelled') {
    return { kind: 'no_payment', refundPct: 0, label: 'Not cancelled' };
  }
  if (!booking.scheduledAt) {
    return { kind: 'free', refundPct: 1, label: 'Full refund' };
  }
  const start = new Date(`${booking.scheduledAt.date}T${booking.scheduledAt.start}:00`).getTime();
  if (isNaN(start)) {
    return { kind: 'free', refundPct: 1, label: 'Full refund' };
  }
  const hoursUntilStart = (start - Date.now()) / 3600_000;
  if (hoursUntilStart >= policy.freeCancelHours) {
    return { kind: 'free', refundPct: 1, label: 'Full refund — cancelled in time' };
  }
  if (hoursUntilStart > 0) {
    return {
      kind: 'late',
      refundPct: (100 - policy.lateFeePct) / 100,
      label: `Late cancellation — ${policy.lateFeePct}% to the professional`,
    };
  }
  return { kind: 'after_start', refundPct: 0, label: 'Cancelled at/after start — professional keeps payment' };
}

export interface RefundSplit {
  refundAmount: number;
  proAmount: number;
}

export function refundSplit(amount: number, outcome: CancellationOutcome): RefundSplit {
  const refund = Math.round(amount * Math.max(0, Math.min(1, outcome.refundPct)));
  return { refundAmount: refund, proAmount: amount - refund };
}

/** Fee split recorded whenever a payment is released to a professional. */
export function releaseFeeSplit(
  amount: number,
  policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY,
): { platformFee: number; proNet: number } {
  const platformFee = Math.round((amount * policy.platformFeePct) / 100);
  return { platformFee, proNet: amount - platformFee };
}

/** Only held digital payments are refundable (cash was never captured). */
export function isRefundable(payment: Pick<PaymentRecord, 'status' | 'method'>): boolean {
  return payment.status === 'held' && payment.method === 'digital';
}
