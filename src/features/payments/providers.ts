/**
 * Payment provider registry — the ONLY place that knows which providers exist.
 *
 * Adding a future provider (Chapa, CBE Birr, card gateway …) means:
 *   1. add a registry entry here (id, label, icon, kind, availability)
 *   2. implement its adapter in Cloud Functions (functions/payments/)
 * UI, booking flow and Firestore schema do not change.
 */
import type { PaymentProvider } from '../../models/types';

export type ProviderKind = 'digital' | 'cash';

export interface PaymentProviderDef {
  id: PaymentProvider;
  label: string;
  labelAm?: string;
  icon: string; // emoji keeps it dependency-free; swap for assets later
  kind: ProviderKind;
  description: string;
  /** true = money is captured up front and held until job completion */
  holdsFunds: boolean;
  /** availability rule (e.g. only for amounts within provider limits) */
  isAvailable?: (amountETB: number) => boolean;
  /** hard off-switch (cash-only launch) */
  disabled?: boolean;
  /** config flag name enabling the provider (functions env parity) */
  envFlag: string;
}

export const PAYMENT_PROVIDERS: PaymentProviderDef[] = [
  {
    id: 'telebirr',
    label: 'Telebirr',
    labelAm: 'ቴሌብር',
    icon: '📱',
    kind: 'digital',
    description: 'Pay with Telebirr. Funds are held securely and released to the professional when the job is done.',
    holdsFunds: true,
    isAvailable: (amount) => amount > 0 && amount <= 100000,
    disabled: true, // cash-only launch — flip when Telebirr merchant creds are live
    envFlag: 'PAYMENTS_TELEBIRR_ENABLED',
  },
  {
    id: 'cash',
    label: 'Cash',
    labelAm: 'ጥሬ ገንዘብ',
    icon: '💵',
    kind: 'cash',
    description: 'Pay the professional in cash when the job is completed. Confirm in the app after payment.',
    holdsFunds: false,
    envFlag: 'PAYMENTS_CASH_ENABLED',
  },
];

export function getPaymentProvider(id: PaymentProvider): PaymentProviderDef | undefined {
  return PAYMENT_PROVIDERS.find((p) => p.id === id);
}

/** Providers a customer can choose for a given amount. */
export function availableProviders(amountETB: number): PaymentProviderDef[] {
  // Telebirr disabled while escrow credentials are pending — flip this flag to re-enable.
  const TELEBIRR_ENABLED = false;
  return PAYMENT_PROVIDERS.filter((p) => !p.disabled && (p.id !== 'telebirr' || TELEBIRR_ENABLED)).filter(
    (p) => (p.isAvailable ? p.isAvailable(amountETB) : true),
  );
}

/** Default provider for a booking (cash keeps the marketplace liquid from day one). */
export const DEFAULT_PROVIDER: PaymentProvider = 'cash';
