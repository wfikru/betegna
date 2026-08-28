/**
 * Cash adapter — no external provider. Records the intent; the professional
 * confirms physical collection on (or right after) job completion.
 * This keeps cash inside the same ledger, disputes flow and analytics as
 * digital payments, without any capture step.
 */

function isConfigured() {
  return process.env.PAYMENTS_CASH_ENABLED !== 'false'; // enabled by default
}

async function createIntent(ctx) {
  void ctx;
  return {
    patch: { status: 'pending' },
    redirectUrl: null, // cash never redirects
  };
}

/** Cash has no webhooks — confirmation comes from confirmCashCollection(). */
function verifyNotification() {
  return null;
}

async function fetchStatus() {
  return null;
}

function settle(paymentDoc, byUid) {
  if (paymentDoc.status !== 'pending' || paymentDoc.method !== 'cash') return null;
  return { status: 'released', confirmedBy: byUid || paymentDoc.payeeUid, releasedAt: Date.now() };
}

module.exports = { id: 'cash', isConfigured, createIntent, verifyNotification, fetchStatus, settle };
