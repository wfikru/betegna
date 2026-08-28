import {
  buildPaymentIntent,
  canTransitionPayment,
  isCountedAsEarning,
  needsPayment,
  outstandingAmount,
  releaseTrigger,
} from '../paymentFlow';
import { availableProviders, DEFAULT_PROVIDER, getPaymentProvider, PAYMENT_PROVIDERS } from '../providers';
import type { Booking, PaymentRecord } from '../../../models/types';

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'bk1',
    requestId: 'rq1',
    customerId: 'c1',
    customerName: 'Customer',
    proId: 'pro1',
    proName: 'Pro',
    serviceId: 's1',
    serviceName: 'House Cleaning',
    total: 1500,
    status: 'completed',
    timeline: [],
    reviewed: false,
    paid: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function payment(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: 'pay1',
    bookingId: 'bk1',
    payerUid: 'c1',
    payeeUid: 'pro1',
    amount: 1500,
    currency: 'ETB',
    provider: 'telebirr',
    method: 'digital',
    status: 'pending',
    initiatedAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('payment provider registry', () => {
  it('registers Telebirr and Cash with correct metadata', () => {
    expect(PAYMENT_PROVIDERS.map((p) => p.id)).toEqual(['telebirr', 'cash']);
    const telebirr = getPaymentProvider('telebirr');
    expect(telebirr?.kind).toBe('digital');
    expect(telebirr?.holdsFunds).toBe(true);
    const cash = getPaymentProvider('cash');
    expect(cash?.kind).toBe('cash');
    expect(cash?.holdsFunds).toBe(false);
  });

  it('defaults to cash', () => {
    expect(DEFAULT_PROVIDER).toBe('cash');
  });

  it('cash-only launch: telebirr is disabled, cash always available', () => {
    expect(availableProviders(1500).map((p) => p.id)).not.toContain('telebirr');
    expect(availableProviders(500000).map((p) => p.id)).not.toContain('telebirr');
    expect(availableProviders(500000).map((p) => p.id)).toContain('cash');
  });

  it('throws on unknown provider when building an intent', () => {
    expect(() => buildPaymentIntent({ booking: booking(), providerId: 'chapa', payerUid: 'c1' })).toThrow();
  });
});

describe('payment state machine', () => {
  it('allows the documented happy paths', () => {
    expect(canTransitionPayment('pending', 'processing')).toBe(true);
    expect(canTransitionPayment('processing', 'held')).toBe(true);
    expect(canTransitionPayment('held', 'released')).toBe(true);
    expect(canTransitionPayment('pending', 'released')).toBe(true); // cash confirmed directly
    expect(canTransitionPayment('held', 'refunded')).toBe(true);
  });

  it('blocks illegal transitions', () => {
    expect(canTransitionPayment('released', 'refunded')).toBe(false);
    expect(canTransitionPayment('failed', 'held')).toBe(false);
    expect(canTransitionPayment('pending', 'held')).toBe(false); // digital must pass through processing
    expect(canTransitionPayment('cancelled', 'pending')).toBe(false);
  });
});

describe('payment rules', () => {
  it('needs payment only for done/in-progress & unpaid bookings', () => {
    expect(needsPayment(booking({ status: 'completed' }))).toBe(true);
    expect(needsPayment(booking({ status: 'in_progress' }))).toBe(true);
    expect(needsPayment(booking({ status: 'completed', paid: true }))).toBe(false);
    expect(needsPayment(booking({ status: 'confirmed' }))).toBe(false);
    expect(needsPayment(booking({ status: 'cancelled' }))).toBe(false);
  });

  it('digital funds are held on capture, cash on completion', () => {
    expect(releaseTrigger('held', 'digital')).toBe('on_completion');
    expect(releaseTrigger('pending', 'digital')).toBe('on_capture');
    expect(releaseTrigger('pending', 'cash')).toBe('on_completion');
  });

  it('builds deterministic intent records', () => {
    const intent = buildPaymentIntent({ booking: booking(), providerId: 'telebirr', payerUid: 'c1' });
    expect(intent.method).toBe('digital');
    expect(intent.status).toBe('pending');
    expect(intent.amount).toBe(1500);
    expect(intent.payeeUid).toBe('pro1');
  });

  it('outstanding is zero while a payment attempt is active', () => {
    const b = booking();
    expect(outstandingAmount(b, [])).toBe(1500);
    expect(outstandingAmount(b, [payment({ status: 'processing' })])).toBe(0);
    expect(outstandingAmount(b, [payment({ status: 'failed' })])).toBe(1500);
    expect(outstandingAmount({ ...b, paid: true }, [payment({ status: 'released' })])).toBe(0);
  });

  it('counts only released payments as pro earnings', () => {
    expect(isCountedAsEarning(payment({ status: 'held' }))).toBe(false);
    expect(isCountedAsEarning(payment({ status: 'released' }))).toBe(true);
  });
});
