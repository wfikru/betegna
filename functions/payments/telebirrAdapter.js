/**
 * Telebirr adapter — Ethio Telecom H5 (SuperApp in-app browser) integration.
 *
 * Flow (matches the provider-agnostic architecture):
 *   1. createIntent   → sign order (SHA256withRSA) → POST /api/web/pay
 *                       → Telebirr returns a payment URL (upop) for the app to open
 *   2. customer pays  → Telebirr POSTs the signed result to our notifyUrl webhook
 *   3. verifyNotification checks the signature → payment moves to `held` (escrow)
 *   4. job completes  → settle() releases funds to the professional's payout
 *   5. fetchStatus    → outOrderQuery polling fallback if a webhook is missed
 *
 * Credentials live in Functions config (never in the app):
 *   TELEBIRR_APP_ID, TELEBIRR_APP_KEY, TELEBIRR_SHORT_CODE,
 *   TELEBIRR_PUBLIC_KEY (provider), TELEBIRR_PRIVATE_KEY (ours),
 *   TELEBIRR_API_URL (e.g. https://app.ethiomobilemoney.et:2121 )
 */
const crypto = require('crypto');

const BASE_HEADERS = { 'Content-Type': 'application/json' };

function cfg() {
  return {
    appId: process.env.TELEBIRR_APP_ID,
    appKey: process.env.TELEBIRR_APP_KEY,
    shortCode: process.env.TELEBIRR_SHORT_CODE,
    publicKey: process.env.TELEBIRR_PUBLIC_KEY,
    privateKey: process.env.TELEBIRR_PRIVATE_KEY,
    apiUrl: process.env.TELEBIRR_API_URL || 'https://app.ethiomobilemoney.et:2121',
    notifyUrl: process.env.TELEBIRR_NOTIFY_URL,
    receiveName: process.env.TELEBIRR_RECEIVE_NAME || 'Betegna',
  };
}

function isConfigured() {
  const c = cfg();
  return Boolean(c.appId && c.appKey && c.shortCode && c.privateKey && c.publicKey);
}

/** Telebirr requires usign(RSA SHA256) of the sorted plain payload. */
function signPayload(payload, privateKeyPem) {
  const plain = Object.keys(payload)
    .sort()
    .map((k) => `${k}=${payload[k]}`)
    .join('&');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(plain, 'utf8');
  return signer.sign(privateKeyPem, 'base64');
}

function verifySignature(payload, usign, publicPem) {
  try {
    const plain = Object.keys(payload)
      .sort()
      .map((k) => `${k}=${payload[k]}`)
      .join('&');
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(plain, 'utf8');
    return verifier.verify(publicPem, usign, 'base64');
  } catch (e) {
    console.warn('telebirr signature verify failed', e?.message);
    return false;
  }
}

function nonce(len = 32) {
  return crypto.randomBytes(len).toString('hex');
}

async function createIntent(ctx) {
  const c = cfg();
  if (!isConfigured()) {
    // sandbox mode: pretend to succeed so QA flows work without credentials
    return {
      patch: { status: 'processing', providerRef: `TB-SANDBOX-${nonce(8).toUpperCase()}` },
      redirectUrl: `https://betegna.app/pay/sandbox/${ctx.paymentId}`,
    };
  }
  const order = {
    appId: c.appId,
    appKey: c.appKey,
    outTradeNo: ctx.paymentId, // our payment doc id — Telebirr echoes it back
    nonce: nonce(),
    notifyUrl: c.notifyUrl,
    receiveName: c.receiveName,
    returnUrl: `betegna://booking/${ctx.bookingId}`,
    shortCode: c.shortCode,
    subject: ctx.subject || 'Betegna service',
    timeoutExpress: '120', // minutes
    timestamp: String(Date.now()),
    totalAmount: String(Math.round(ctx.amount * 100)), // santim (verify unit with account docs)
  };
  const body = { ...order, usign: signPayload(order, c.privateKey) };

  const res = await fetch(`${c.apiUrl}/api/web/pay`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.pay_url) {
    throw new Error(`Telebirr createIntent failed: HTTP ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  }
  return {
    patch: { status: 'processing', providerRef: String(data.tradeNo || ctx.paymentId) },
    redirectUrl: String(data.pay_url),
  };
}

/** Webhook payload: { outTradeNo, tradeNo, tradeStatus, totalAmount, usign, … } */
function verifyNotification(payload) {
  const c = cfg();
  const { usign, ...fields } = payload || {};
  if (!usign || !verifySignature(fields, usign, c.publicKey)) return null;
  const paid = ['2', 'Completed', 'SUCCESS', 'success'].includes(String(payload.tradeStatus));
  return {
    ok: paid,
    providerRef: String(payload.tradeNo || ''),
    patch: paid
      ? { status: 'held' } // captured → escrow until job completion
      : { status: 'failed', failureReason: `Telebirr status ${payload.tradeStatus}` },
  };
}

/** Polling fallback: outOrderQuery by our outTradeNo. */
async function fetchStatus(paymentDoc) {
  const c = cfg();
  if (!isConfigured()) return null;
  const q = {
    appId: c.appId,
    appKey: c.appKey,
    outTradeNo: paymentDoc.id,
    nonce: nonce(),
    timestamp: String(Date.now()),
  };
  const res = await fetch(`${c.apiUrl}/api/web/query`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({ ...q, usign: signPayload(q, c.privateKey) }),
  });
  const data = await res.json().catch(() => ({}));
  const status = String(data.tradeStatus || '').toLowerCase();
  if (['2', 'completed', 'success'].includes(status)) return { status: 'held', providerRef: String(data.tradeNo || '') };
  if (['failed', 'closed', 'cancelled'].includes(status)) return { status: 'failed', failureReason: `Telebirr reported ${status}` };
  return null;
}

/** Escrow release when the job completes. */
function settle(paymentDoc) {
  if (paymentDoc.status !== 'held') return null;
  return { status: 'released', releasedAt: Date.now() };
}

/**
 * Refund a captured (held) payment back to the customer's Telebirr wallet.
 * Signed like every other request; amount omitted = full refund.
 */
async function refund(paymentDoc, amountBirr) {
  const c = cfg();
  if (!isConfigured()) {
    return { status: 'refunded', refundAmount: amountBirr ?? paymentDoc.amount }; // sandbox
  }
  const body = {
    appId: c.appId,
    appKey: c.appKey,
    outTradeNo: paymentDoc.providerRef || paymentDoc.id,
    refundAmount: String(Math.round((amountBirr ?? paymentDoc.amount) * 100)),
    nonce: nonce(),
    timestamp: String(Date.now()),
    refundReason: 'Betegna cancellation settlement',
  };
  const res = await fetch(`${c.apiUrl}/api/web/refund`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({ ...body, usign: signPayload(body, c.privateKey) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Telebirr refund failed: HTTP ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  return { status: 'refunded', refundAmount: amountBirr ?? paymentDoc.amount, providerRef: String(data.refundNo || paymentDoc.providerRef || '') };
}

module.exports = { id: 'telebirr', isConfigured, createIntent, verifyNotification, fetchStatus, settle, refund };
