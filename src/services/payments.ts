/**
 * PaymentService — provider-agnostic facade over the payment architecture.
 *
 *   App UI → this service → (demo: simulated adapters) or (prod: Firebase
 *   Functions `createPayment` → adapter registry → Telebirr / Cash / future)
 *
 * The UI never knows which provider it is talking to beyond the registry
 * metadata (label/icon) it renders.
 */
import { ENV } from '../config/env';
import type { Booking, PaymentProvider, PaymentRecord } from '../models/types';
import { demo } from './firebase/demoDb';
import { availableProviders, getPaymentProvider, type PaymentProviderDef } from '../features/payments/providers';
import { needsPayment } from '../features/payments/paymentFlow';
import { analytics } from './analytics';
import { newId } from '../utils/id';

export { availableProviders, getPaymentProvider };
export type { PaymentProviderDef };

/** Methods the customer can pay this booking with. */
export function paymentMethodsFor(booking: Pick<Booking, 'total' | 'status' | 'paid'>): PaymentProviderDef[] {
  if (!needsPayment(booking)) return [];
  return availableProviders(booking.total);
}

/**
 * Start a payment. Demo simulates the provider; production calls the
 * `createPayment` callable which routes to the adapter and returns
 * `{ paymentId, redirectUrl? }` for digital providers.
 */
export async function initiatePayment(
  user: { uid: string },
  booking: Pick<Booking, 'id' | 'total'>,
  providerId: PaymentProvider,
): Promise<{ paymentId: string; redirectUrl?: string }> {
  analytics.track('payment_initiated', { provider: providerId, amount: booking.total });
  if (ENV.isDemo) {
    await demo.ready();
    const record = demo.initiatePayment(user.uid, booking.id, providerId);
    return { paymentId: record.id, redirectUrl: undefined };
  }
  const { getFunctions, httpsCallable } = await import('firebase/functions');
  const { getApps, getApp } = await import('firebase/app');
  if (!getApps().length) throw new Error('Firebase not configured');
  const fn = getFunctions(getApp(), 'europe-west1');
  const result = await httpsCallable(fn, 'createPayment')({
    bookingId: booking.id,
    providerId,
  });
  return result.data as { paymentId: string; redirectUrl?: string };
}

/** Professional confirms a cash collection after the job. */
export async function confirmCashCollected(
  user: { uid: string },
  payment: Pick<PaymentRecord, 'id'>,
): Promise<void> {
  analytics.track('payment_cash_confirmed', { paymentId: payment.id });
  if (ENV.isDemo) {
    demo.confirmPaymentCollected(payment.id, user.uid);
    return;
  }
  const { getFunctions, httpsCallable } = await import('firebase/functions');
  const { getApps, getApp } = await import('firebase/app');
  if (!getApps().length) throw new Error('Firebase not configured');
  const fn = getFunctions(getApp(), 'europe-west1');
  await httpsCallable(fn, 'confirmCashCollection')({ paymentId: payment.id });
}

/** Poll provider status (webhook fallback for Telebirr). */
export async function refreshPaymentStatus(paymentId: string): Promise<void> {
  if (ENV.isDemo) return; // simulated adapter updates locally
  const { getFunctions, httpsCallable } = await import('firebase/functions');
  const { getApps, getApp } = await import('firebase/app');
  if (!getApps().length) return;
  const fn = getFunctions(getApp(), 'europe-west1');
  await httpsCallable(fn, 'getPaymentStatus')({ paymentId });
}

export function subscribePayments(uid: string, cb: (p: PaymentRecord[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.paymentsFor(uid)));
    return demo.subscribe('payments', () => cb(demo.paymentsFor(uid)));
  }
  // firebase: onSnapshot over payments where payerUid|payeeUid == uid (composite index documented)
  return () => {};
}

export async function proEarningsThisMonth(uid: string): Promise<number> {
  if (ENV.isDemo) {
    await demo.ready();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return demo
      .paymentsFor(uid)
      .filter(
        (p) =>
          p.payeeUid === uid &&
          p.status === 'released' &&
          (p.releasedAt ?? p.updatedAt) >= monthStart.getTime(),
      )
      .reduce((s, p) => s + (p.proNet ?? p.amount), 0);
  }
  return 0;
}

void newId; // reserved for future client-side intent drafts
