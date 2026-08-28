# Payment Architecture — Telebirr + Cash (provider-agnostic)

## Status: cash-only launch
Telebirr is **disabled** in the provider registry (`disabled: true` + `availableProviders` gate in `src/features/payments/providers.ts`) and rejected server-side unless `PAYMENTS_TELEBIRR_ENABLED=true` on Functions. The adapter, webhook and escrow flow are complete and dormant — re-enabling is configuration, not code. Cash runs the full ledger: intent → pro confirms collection → released (with fee split).

## Principle
The app is **never coupled to Telebirr** (or any single provider). All payment behavior flows through one abstraction; providers are adapters behind a registry — on the client *and* on the server.

```
                Mobile App  (React Native + Expo)
                        |
                 PaymentService            src/services/payments.ts
                        |
                 Cloud Functions
                        |
            +-----------+-----------+
            |                       |
     TelebirrAdapter          CashPaymentAdapter      functions/payments/*
            |                       |
       Telebirr H5 API         Cash workflow
     (RSA-signed order,
      signed webhook)
```

## Client side

- **`src/features/payments/providers.ts`** — the registry (id, label አማርኛ, icon, kind, escrow behavior, amount limits, env flag). This is the *only* place providers are enumerated; rendering is generic.
- **`src/features/payments/paymentFlow.ts`** — pure, unit-tested logic: payment status machine (`pending → processing → held → released`, with `failed/cancelled/refunded`), "needs payment" rules, escrow-release triggers, intent building, outstanding-amount math, status metadata for badges.
- **`src/services/payments.ts`** — facade the UI calls: `paymentMethodsFor(booking)`, `initiatePayment()` (demo simulates; production calls the `createPayment` callable and opens the returned `redirectUrl`), `confirmCashCollected()`, `refreshPaymentStatus()` (webhook-fallback polling), `subscribePayments()`, `proEarningsThisMonth()`.

**UI surfaces:** Booking Detail shows the payment card — method choice (📱 Telebirr / 💵 Cash) once work is done, live status (Confirming → Held in escrow → Paid), and the pro's "Confirm cash received" action. Profile → Payment history (customer receipts / pro earnings). No screen imports a provider by name.

## Server side (Cloud Functions)

| Function | Kind | Purpose |
|---|---|---|
| `createPayment` | callable | validates booking + caller, routes to adapter via `functions/payments/registry.js`, writes the `payments` doc, returns `{ paymentId, redirectUrl }` |
| `telebirrNotify` | HTTPS webhook | verifies Telebirr's RSA signature → `held` (escrow) or `failed`; responds 200 so Telebirr stops retrying |
| `confirmCashCollection` | callable | pro-only; settles a pending cash payment → `released` + booking `paid` |
| `getPaymentStatus` | callable | polls the adapter (`outOrderQuery`) when a webhook is missed |
| `onBookingCompletedPaymentRelease` | Firestore trigger | releases escrowed (`held`) digital payments when a booking completes |

**Adapter contract** (same for every provider — this is what makes future providers cheap):

```js
{
  id,                       // 'telebirr' | 'cash' | …
  isConfigured(),           // env credentials present?
  createIntent(ctx),        // → { patch, redirectUrl? }
  verifyNotification(req),  // webhook → { ok, providerRef, patch } | null
  fetchStatus(paymentDoc),  // polling fallback → patch | null
  settle(paymentDoc, uid),  // completion rules → patch | null
}
```

**Adding Chapa / CBE Birr / a card gateway later:** write `functions/payments/<name>Adapter.js`, add one registry line, add a `providers.ts` entry for the UI metadata. No screen, rule, or schema change.

## Telebirr specifics (`functions/payments/telebirrAdapter.js`)

- H5 flow: build order (`outTradeNo` = our payment doc id, amount in santim, nonce, timestamp, `notifyUrl`, `returnUrl` → `betegna://booking/:id`) → sign with **SHA256withRSA** over sorted `k=v&k=v` plain → `POST {apiUrl}/api/web/pay` → returns the customer payment URL.
- Webhook `usign` verified against Telebirr's public key before any state change.
- Escrow semantics: capture ⇒ `held`; release only on job completion (trigger), never on capture.
- Credentials (env, never in the app): `TELEBIRR_APP_ID`, `TELEBIRR_APP_KEY`, `TELEBIRR_SHORT_CODE`, `TELEBIRR_PUBLIC_KEY`, `TELEBIRR_PRIVATE_KEY`, `TELEBIRR_API_URL`, `TELEBIRR_NOTIFY_URL`, `TELEBIRR_RECEIVE_NAME`.
- Without credentials the adapter runs in **sandbox mode** (fabricated order + app-side payment page URL) so QA flows work end-to-end. ⚠️ Verify amount unit (birr vs santim) and endpoint paths against your merchant onboarding docs before go-live.

## Lifecycle completion (refunds, fees, expiry)

- **Escrow release when capture happens *after* completion** — webhook/`updatePayment` checks the booking state and releases immediately instead of waiting for a completion trigger that already fired.
- **Cancellation settlement** (`onBookingCancelledRefund` trigger + `features/payments/refunds.ts` policy, mirrored in the demo backend):
  - cancelled **≥ 24 h** before start → 100% refund to the customer's Telebirr
  - **< 24 h** → late fee (default 10%) released to the pro (with platform fee), remainder refunded
  - **at/after start** → professional keeps the payment
  - Policy values are env-configurable (`PAYMENTS_FREE_CANCEL_HOURS`, `PAYMENTS_LATE_FEE_PCT`) — no code changes to re-tune.
  - The Booking Detail shows a refund receipt (amount returned + any late-cancellation fee).
- **Platform fee split at release** (`PAYMENTS_PLATFORM_FEE_PCT`, default 12%) — every released payment records `platformFee` + `proNet`; pro earnings screens and notifications show net amounts.
- **Webhook idempotency** — `telebirrNotify` ignores notifications for payments already `held/released/refunded` (Telebirr retries make this mandatory).
- **Stale payment expiry** — scheduled `expireStalePayments` (every 15 min) fails `processing` payments older than 3 h (missed webhook / abandoned checkout) so the customer can retry.
- **Refunds API** — `telebirrAdapter.refund(payment, amount)` issues a signed Telebirr refund; sandbox mode settles locally.

## Cash workflow

Cash lives in the same ledger as digital payments (one disputes/analytics pipeline): intent → `pending` → pro taps **Confirm cash received** after the job → `released` (+ `confirmedBy` audit field) → booking `paid`. Disputes for unpaid cash jobs surface automatically via the outstanding-payment state.

## Firestore (`payments/{id}`)

```
id, bookingId, requestId?, payerUid, payeeUid, amount, currency: 'ETB',
provider: 'telebirr'|'cash'|…, method: 'digital'|'cash',
status: pending|processing|held|released|failed|cancelled|refunded,
providerRef?, payerPhone?, failureReason?,
initiatedAt, updatedAt, releasedAt?, confirmedBy?
```

Writes are Cloud-Functions-only (see `firestore.rules`); users read their own payments. Pro payouts of escrowed funds (Phase 3) consume the same records — payout provider is a *separate* concern from payment provider.

## Demo mode
`demoDb.initiatePayment` simulates the Telebirr adapter: `processing` with a `TB…` ref → confirms to `held` after ~6s (with customer notification) → auto-releases when the booking completes. Cash settles via the pro's confirm action (simulated bookings settle themselves), so the full escrow UX is explorable without credentials.
