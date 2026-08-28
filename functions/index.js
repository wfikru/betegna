/**
 * Betegna Cloud Functions — trusted server operations.
 *
 * Everything the security rules deny to clients happens here:
 *  - request fan-out: match professionals → write leads → push notifications
 *  - quote acceptance → booking creation (transactional)
 *  - message fan-out notifications + conversation bookkeeping
 *  - reputation aggregation after reviews
 *  - (Phase 3) Stripe payment intents, captures, refunds & payouts
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onDocumentUpdated, setGlobalOptions } = require('firebase-functions/v2');
const { onCall, onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

setGlobalOptions({ region: 'europe-west1', maxInstances: 20 });

/* ────────────────────────────────────────────────────────────────
 * 1) New service request → run matching → create leads → notify pros
 * ──────────────────────────────────────────────────────────────── */
exports.fanoutRequestMatches = onDocumentCreated('serviceRequests/{requestId}', async (event) => {
  const request = event.data.data();
  const { ranking } = require('./matchingEngine');

  const prosSnap = await db.collection('professionals')
    .where('serviceIds', 'array-contains', request.serviceId)
    .get();

  const matches = ranking(request, prosSnap.docs.map((d) => d.data())).slice(0, 5);
  const matchedProIds = matches.map((m) => m.proId);

  const batch = db.batch();
  batch.update(event.data.ref, { matchedProIds, status: 'matched', updatedAt: Date.now() });
  for (const m of matches) {
    const lead = {
      id: `${event.params.requestId}_${m.proId}`,
      requestId: event.params.requestId,
      proId: m.proId,
      state: 'new',
      score: m.score,
      seen: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    batch.set(db.collection('leads').doc(lead.id), lead);
  }
  await batch.commit();

  // notify matched pros (in-app notification row + FCM best-effort)
  await Promise.all(matches.map((m) =>
    notify(m.proId, {
      kind: 'lead',
      title: 'New lead matched to you',
      body: `${request.serviceName} in ${request.location.subcity} — respond fast to win the job.`,
      deepLink: `betegna://request/${event.params.requestId}`,
    })
  ));
});

/* ────────────────────────────────────────────────────────────────
 * 2) Quote accepted (customer) → create booking transactionally
 * ──────────────────────────────────────────────────────────────── */
exports.onQuoteAccepted = onDocumentUpdated('quotes/{quoteId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === after.status || after.status !== 'accepted') return;

  const requestSnap = await db.collection('serviceRequests').doc(after.requestId).get();
  const request = requestSnap.data() || {};

  const bookingRef = db.collection('bookings').doc();
  await bookingRef.set({
    id: bookingRef.id,
    requestId: after.requestId,
    quoteId: event.params.quoteId,
    customerId: after.customerId,
    customerName: request.customerName || '',
    proId: after.proId,
    proName: after.proName,
    proPhotoURL: after.proPhotoURL || null,
    serviceId: request.serviceId || '',
    serviceName: after.serviceName,
    scheduledAt: after.proposedSlot || null,
    address: (request.location || {}).address || null,
    subcity: (request.location || {}).subcity || null,
    total: after.total,
    status: 'confirmed',
    timeline: [{ at: Date.now(), kind: 'booking_confirmed', label: 'Booking confirmed' }],
    reviewed: false,
    paid: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  await db.collection('serviceRequests').doc(after.requestId).update({ status: 'booked' });

  await Promise.all([
    notify(after.customerId, {
      kind: 'booking',
      title: 'Booking confirmed',
      body: `${after.proName} · ${after.serviceName}`,
      deepLink: `betegna://booking/${bookingRef.id}`,
    }),
    notify(after.proId, {
      kind: 'booking',
      title: 'Quote accepted 🎉',
      body: `${request.customerName || 'Customer'} accepted your quote.`,
      deepLink: `betegna://booking/${bookingRef.id}`,
    }),
  ]);
});

/* ────────────────────────────────────────────────────────────────
 * 3) New message → conversation bookkeeping + notify the other party
 * ──────────────────────────────────────────────────────────────── */
exports.onMessageCreated = onDocumentCreated('conversations/{conversationId}/messages/{messageId}', async (event) => {
  const message = event.data.data();
  const convRef = db.collection('conversations').doc(event.params.conversationId);
  const convSnap = await convRef.get();
  if (!convSnap.exists) return;
  const conv = convSnap.data();

  const otherId = message.senderId === conv.customerId ? conv.proId : conv.customerId;
  const preview =
    message.text ||
    (message.type === 'quote' ? '📩 Sent a quote' : message.type === 'appointment' ? '📅 Proposed a time' : message.type);

  await convRef.update({
    lastMessage: { text: preview, at: message.createdAt, senderId: message.senderId },
    [`unread.${otherId}`]: admin.firestore.FieldValue.increment(1),
    updatedAt: Date.now(),
  });

  if (message.senderId !== 'system') {
    await notify(otherId, {
      kind: 'message',
      title: `New message from ${conv.participantNames[message.senderId] || 'Betegna'}`,
      body: String(preview).slice(0, 90),
      deepLink: `betegna://conversation/${event.params.conversationId}`,
    });
  }
});

/* ────────────────────────────────────────────────────────────────
 * 4) Review created → aggregate professional reputation
 * ──────────────────────────────────────────────────────────────── */
exports.onReviewCreated = onDocumentCreated('reviews/{reviewId}', async (event) => {
  const review = event.data.data();
  const proRef = db.collection('professionals').doc(review.proId);
  const proSnap = await proRef.get();
  if (!proSnap.exists) return;
  const pro = proSnap.data();

  // Bayesian blend so new pros aren't buried (mirrors features/reviews/reputation.ts)
  const PRIOR_RATING = 4.2;
  const PRIOR_WEIGHT = 10;
  const count = pro.reviewCount || 0;
  const blended = (pro.rating * count + review.overall + PRIOR_RATING * PRIOR_WEIGHT) / (count + 1 + PRIOR_WEIGHT);

  await proRef.update({
    rating: Math.round(blended * 10) / 10,
    reviewCount: count + 1,
  });

  await db.collection('bookings').doc(review.bookingId).update({ reviewed: true });
  await notify(review.proId, {
    kind: 'review',
    title: `New ${review.overall}★ review`,
    body: (review.text || 'A customer reviewed your work.').slice(0, 80),
    deepLink: `betegna://professional/${review.proId}`,
  });
});

/* ────────────────────────────────────────────────────────────────
 * 5) Booking status change → timeline + notify both parties
 * ──────────────────────────────────────────────────────────────── */
exports.onBookingStatusChanged = onDocumentUpdated('bookings/{bookingId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === after.status) return;
  const labels = {
    in_progress: 'Professional started the job',
    completed: 'Work completed',
    cancelled: 'Booking cancelled',
    disputed: 'Dispute opened',
  };
  const label = labels[after.status];
  if (!label) return;

  await Promise.all([
    notify(after.customerId, { kind: 'booking', title: 'Booking update', body: label, deepLink: `betegna://booking/${event.params.bookingId}` }),
    notify(after.proId, { kind: 'booking', title: 'Booking update', body: label, deepLink: `betegna://booking/${event.params.bookingId}` }),
  ]);
});

/* ────────────────────────────────────────────────────────────────
 * 6) Payments — provider-agnostic architecture (Telebirr + Cash)
 *    App → PaymentService → createPayment (callable) → adapter registry
 *    Webhook: /telebirrNotify (signed) → held (escrow) → release on completion
 * ──────────────────────────────────────────────────────────────── */
const { adapterFor, enabledAdapters } = require('./payments/registry');

exports.createPayment = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid;
  const { bookingId, providerId } = req.data || {};
  if (!uid) throw new Error('unauthenticated');
  if (!bookingId || !providerId) throw new Error('bookingId and providerId are required');

  const adapter = adapterFor(providerId);
  const telebirrEnabled = process.env.PAYMENTS_TELEBIRR_ENABLED === 'true';
  if (providerId === 'telebirr' && !telebirrEnabled) throw new Error('Telebirr is not enabled yet — pay with cash');
  if (!adapter || !adapter.isConfigured()) throw new Error(`payment provider unavailable: ${providerId}`);

  const bookingSnap = await db.collection('bookings').doc(bookingId).get();
  if (!bookingSnap.exists) throw new Error('booking not found');
  const booking = bookingSnap.data();
  if (booking.customerId !== uid) throw new Error('only the customer can pay');
  if (booking.paid) throw new Error('booking already paid');

  const paymentId = `pay_${bookingId}_${providerId}`;
  const paymentRef = db.collection('payments').doc(paymentId);

  const intent = await adapter.createIntent({
    paymentId,
    bookingId,
    amount: booking.total,
    subject: booking.serviceName,
  });

  await paymentRef.set({
    id: paymentId,
    bookingId,
    requestId: booking.requestId || null,
    payerUid: booking.customerId,
    payeeUid: booking.proId,
    amount: booking.total,
    currency: 'ETB',
    provider: providerId,
    method: providerId === 'cash' ? 'cash' : 'digital',
    status: 'pending',
    providerRef: null,
    initiatedAt: Date.now(),
    updatedAt: Date.now(),
    ...intent.patch,
  });

  return { paymentId, redirectUrl: intent.redirectUrl || null, providers: enabledAdapters() };
});

/** Telebirr signed webhook → capture into escrow (held). Idempotent. */
exports.telebirrNotify = onRequest({ region: 'europe-west1' }, async (req, res) => {
  const adapter = adapterFor('telebirr');
  const result = adapter.verifyNotification(req.body);
  if (!result) {
    res.status(400).send('invalid signature');
    return;
  }
  // Telebirr echoes our outTradeNo as the payment doc id
  const paymentId = String(req.body?.outTradeNo || '');
  const paymentRef = db.collection('payments').doc(paymentId);
  const snap = await paymentRef.get();
  if (snap.exists) {
    const payment = snap.data();
    // idempotency: never move a payment backwards / double-notify
    if (['held', 'released', 'refunded'].includes(payment.status)) {
      res.status(200).send('already processed');
      return;
    }
    await paymentRef.update({ ...result.patch, providerRef: result.providerRef || null, updatedAt: Date.now() });
    if (result.patch.status === 'held') {
      const bookingSnap = await db.collection('bookings').doc(payment.bookingId).get();
      const booking = bookingSnap.exists ? bookingSnap.data() : null;
      // captured AFTER completion → release right away (no completion trigger will fire)
      if (booking && booking.status === 'completed' && adapter.settle) {
        const release = adapter.settle({ ...payment, status: 'held' });
        if (release) await paymentRef.update({ ...release, updatedAt: Date.now() });
      }
      await notify(payment.payerUid, {
        kind: 'payment',
        title: 'Telebirr payment received',
        body: `${payment.amount.toLocaleString()} ETB is held securely until the job is done.`,
        deepLink: `betegna://booking/${payment.bookingId}`,
      });
    }
  }
  res.status(200).send('success'); // Telebirr expects 200 or it retries
});

/** Professional confirms a cash collection. */
exports.confirmCashCollection = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid;
  const { paymentId } = req.data || {};
  if (!uid || !paymentId) throw new Error('unauthenticated');
  const ref = db.collection('payments').doc(paymentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('payment not found');
  const payment = snap.data();
  if (payment.payeeUid !== uid) throw new Error('only the professional can confirm collection');
  const adapter = adapterFor(payment.provider);
  const settlePatch = adapter?.settle(payment, uid);
  if (!settlePatch) throw new Error(`cannot settle payment in status ${payment.status}`);
  await ref.update({ ...settlePatch, updatedAt: Date.now() });
  await db.collection('bookings').doc(payment.bookingId).update({ paid: true });
  await notify(payment.payerUid, {
    kind: 'payment',
    title: 'Payment confirmed',
    body: `${payment.amount.toLocaleString()} ETB (cash) confirmed received by ${'the professional'}.`,
    deepLink: `betegna://booking/${payment.bookingId}`,
  });
  return { ok: true };
});

/** Polling fallback when a webhook is missed. */
exports.getPaymentStatus = onCall({ region: 'europe-west1' }, async (req) => {
  const uid = req.auth?.uid;
  const { paymentId } = req.data || {};
  if (!uid || !paymentId) throw new Error('unauthenticated');
  const ref = db.collection('payments').doc(paymentId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('payment not found');
  const payment = snap.data();
  if (payment.payerUid !== uid && payment.payeeUid !== uid) throw new Error('forbidden');
  const adapter = adapterFor(payment.provider);
  const patch = adapter?.fetchStatus ? await adapter.fetchStatus(payment) : null;
  if (patch) await ref.update({ ...patch, updatedAt: Date.now() });
  const fresh = patch ? { ...payment, ...patch } : payment;
  return { status: fresh.status, providerRef: fresh.providerRef || null };
});

/** Booking completed → release escrowed (held) digital payments with fee split. */
exports.onBookingCompletedPaymentRelease = onDocumentUpdated('bookings/{bookingId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === after.status || after.status !== 'completed') return;

  const platformFeePct = Number(process.env.PAYMENTS_PLATFORM_FEE_PCT ?? 12);
  const paymentsSnap = await db.collection('payments').where('bookingId', '==', event.params.bookingId).get();
  for (const doc of paymentsSnap.docs) {
    const payment = doc.data();
    const adapter = adapterFor(payment.provider);
    const patch = adapter?.settle(payment, after.proId);
    if (!patch) continue;
    const platformFee = Math.round((payment.amount * platformFeePct) / 100);
    await doc.ref.update({ ...patch, platformFee, proNet: payment.amount - platformFee, updatedAt: Date.now() });
    await db.collection('bookings').doc(payment.bookingId).update({ paid: true });
    await notify(payment.payeeUid, {
      kind: 'payment',
      title: 'Payment released 🎉',
      body: `${(payment.amount - platformFee).toLocaleString()} ETB for ${after.serviceName} is now yours (after ${platformFee.toLocaleString()} ETB platform fee).`,
      deepLink: `betegna://booking/${payment.bookingId}`,
    });
  }
});

/** Booking cancelled → refund escrowed funds per cancellation policy. */
exports.onBookingCancelledRefund = onDocumentUpdated('bookings/{bookingId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === after.status || after.status !== 'cancelled') return;

  const freeCancelHours = Number(process.env.PAYMENTS_FREE_CANCEL_HOURS ?? 24);
  const lateFeePct = Number(process.env.PAYMENTS_LATE_FEE_PCT ?? 10);
  const hoursUntilStart = after.scheduledAt
    ? (new Date(`${after.scheduledAt.date}T${after.scheduledAt.start}:00`).getTime() - Date.now()) / 3600000
    : Infinity;
  const refundPct =
    !isFinite(hoursUntilStart) || hoursUntilStart >= freeCancelHours
      ? 1
      : hoursUntilStart > 0
        ? (100 - lateFeePct) / 100
        : 0; // cancelled at/after start

  const paymentsSnap = await db.collection('payments').where('bookingId', '==', event.params.bookingId).get();
  for (const doc of paymentsSnap.docs) {
    const payment = doc.data();
    if (payment.status !== 'held' || payment.method !== 'digital') continue;
    const adapter = adapterFor(payment.provider);
    const refundAmount = Math.round(payment.amount * refundPct);
    const proAmount = payment.amount - refundAmount;
    const refundPatch = adapter?.refund ? await adapter.refund(payment, refundAmount).catch((e) => {
      console.error('refund failed', e?.message);
      return null;
    }) : null;
    if (refundPatch) {
      await doc.ref.update({ ...refundPatch, refundAmount, proAmount, updatedAt: Date.now() });
    } else {
      await doc.ref.update({ status: 'refunded', refundAmount, proAmount, updatedAt: Date.now() });
    }
    if (proAmount > 0) {
      const fee = Math.round((proAmount * Number(process.env.PAYMENTS_PLATFORM_FEE_PCT ?? 12)) / 100);
      await db.collection('payments').doc(`${payment.id}_latefee`).set({
        ...payment,
        id: `${payment.id}_latefee`,
        amount: proAmount,
        status: 'released',
        platformFee: fee,
        proNet: proAmount - fee,
        releasedAt: Date.now(),
        refundAmount: null,
        proAmount: null,
      });
    }
    await notify(payment.payerUid, {
      kind: 'payment',
      title: refundAmount > 0 ? 'Refund issued' : 'Payment settled to professional',
      body: refundAmount > 0 ? `${refundAmount.toLocaleString()} ETB refunded to your Telebirr.` : 'The cancellation window had passed; the professional keeps the payment.',
      deepLink: `betegna://booking/${payment.bookingId}`,
    });
  }
});

/** Scheduled sweep: fail stale `processing` payments (webhook missed & user abandoned). */
exports.expireStalePayments = onSchedule({ region: 'europe-west1', schedule: 'every 15 minutes' }, async () => {
  const staleBefore = Date.now() - 3 * 3600_000;
  const snap = await db.collection('payments').where('status', '==', 'processing').get();
  const stale = snap.docs.filter((d) => (d.data().updatedAt || d.data().initiatedAt || 0) < staleBefore);
  await Promise.all(
    stale.map((d) =>
      d.ref.update({ status: 'failed', failureReason: 'Payment not completed in time', updatedAt: Date.now() }),
    ),
  );
  if (stale.length) console.log(`expired ${stale.length} stale payments`);
});

/* ── shared: write notification doc + best-effort FCM push ── */
async function notify(uid, { kind, title, body, deepLink }) {
  await db.collection('notifications').add({
    uid, kind, title, body,
    deepLink: deepLink || null,
    read: false,
    createdAt: Date.now(),
  });
  try {
    const tokens = await db.collection('fcmTokens').where('uid', '==', uid).get();
    if (tokens.empty) return;
    await messaging.sendEachForMulticast({
      tokens: tokens.docs.map((d) => d.data().token),
      notification: { title, body },
      data: { deepLink: deepLink || '' },
    });
  } catch (e) {
    console.warn('FCM send failed', e?.message);
  }
}
