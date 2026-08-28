/**
 * Payment adapter registry (server-side).
 *
 * Each adapter implements the SAME contract, so the app and the callable
 * functions never branch on provider internals. Adding a provider later
 * (Chapa, CBE Birr, card gateway) = one new file + one registry entry.
 *
 * Adapter contract:
 *   id
 *   isConfigured()                 → env credentials present?
 *   createIntent(ctx)              → { paymentDoc patch, redirectUrl? }
 *   verifyNotification(payload)    → { providerRef, ok, patch } | null (webhook)
 *   fetchStatus(paymentDoc)        → patch (polling fallback)
 *   settle(paymentDoc)             → release rules on completion
 */

const TELEBIRR = require('./telebirrAdapter');
const CASH = require('./cashAdapter');

const REGISTRY = {
  telebirr: TELEBIRR,
  cash: CASH,
};

function adapterFor(providerId) {
  return REGISTRY[providerId] || null;
}

function enabledAdapters() {
  return Object.entries(REGISTRY)
    .filter(([, a]) => a.isConfigured())
    .map(([id]) => id);
}

module.exports = { adapterFor, enabledAdapters, REGISTRY };
