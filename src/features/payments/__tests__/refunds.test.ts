import {
  cancellationOutcome,
  DEFAULT_CANCELLATION_POLICY,
  isRefundable,
  refundSplit,
  releaseFeeSplit,
} from '../refunds';
import type { Booking, PaymentRecord } from '../../../models/types';

const HOUR = 3600_000;

function bookingAt(hoursFromNow: number | null, status: Booking['status'] = 'cancelled'): Pick<Booking, 'status' | 'scheduledAt'> {
  if (hoursFromNow === null) return { status, scheduledAt: undefined };
  const d = new Date(Date.now() + hoursFromNow * HOUR);
  const iso = d.toISOString().slice(0, 10);
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { status, scheduledAt: { date: iso, start: hhmm, end: hhmm } };
}

function payment(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: 'pay1',
    bookingId: 'bk1',
    payerUid: 'c1',
    payeeUid: 'pro1',
    amount: 1000,
    currency: 'ETB',
    provider: 'telebirr',
    method: 'digital',
    status: 'held',
    initiatedAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('cancellation policy', () => {
  it('gives a full refund when cancelled outside the free window', () => {
    const o = cancellationOutcome(bookingAt(DEFAULT_CANCELLATION_POLICY.freeCancelHours + 2));
    expect(o.kind).toBe('free');
    expect(o.refundPct).toBe(1);
  });

  it('charges the late fee inside the free window', () => {
    const o = cancellationOutcome(bookingAt(3));
    expect(o.kind).toBe('late');
    expect(o.refundPct).toBe(0.9); // 10% late fee
  });

  it('keeps the full payment for the pro when cancelled at/after start', () => {
    const o = cancellationOutcome(bookingAt(-1));
    expect(o.kind).toBe('after_start');
    expect(o.refundPct).toBe(0);
  });

  it('handles missing schedule as a free refund and non-cancellations as none', () => {
    expect(cancellationOutcome(bookingAt(null)).refundPct).toBe(1);
    expect(cancellationOutcome(bookingAt(48, 'completed')).kind).toBe('no_payment');
  });
});

describe('refund split', () => {
  it('splits amounts exactly with no lost cents', () => {
    const s = refundSplit(1000, { kind: 'late', refundPct: 0.9, label: '' });
    expect(s.refundAmount + s.proAmount).toBe(1000);
    expect(s.refundAmount).toBe(900);
    expect(s.proAmount).toBe(100);
  });

  it('rounds to whole birr for odd amounts', () => {
    const s = refundSplit(999, { kind: 'late', refundPct: 0.9, label: '' });
    expect(s.refundAmount + s.proAmount).toBe(999);
  });
});

describe('release fee split', () => {
  it('records platform fee and pro net', () => {
    const { platformFee, proNet } = releaseFeeSplit(1500);
    expect(platformFee).toBe(180); // 12%
    expect(proNet).toBe(1320);
    expect(platformFee + proNet).toBe(1500);
  });
});

describe('refundability', () => {
  it('only held digital payments are refundable (cash was never captured)', () => {
    expect(isRefundable(payment())).toBe(true);
    expect(isRefundable(payment({ status: 'released' }))).toBe(false);
    expect(isRefundable(payment({ status: 'processing' }))).toBe(false);
    expect(isRefundable(payment({ method: 'cash', status: 'pending' }))).toBe(false);
  });
});
