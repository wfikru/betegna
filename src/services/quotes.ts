/** Quotes & estimates service. */
import { ENV } from '../config/env';
import type { Lead, ProfessionalProfile, ProposedSlot, Quote, QuoteLineItem, QuoteStatus } from '../models/types';
import { demo } from './firebase/demoDb';
import * as fb from './firebase/firebaseClient';
import { newId } from '../utils/id';
import { computeQuoteTotals } from '../features/quotes/quoteMath';
import { analytics } from './analytics';

export interface QuoteInput {
  lines: QuoteLineItem[];
  discount: number;
  taxPct: number;
  durationHours?: number;
  slot?: ProposedSlot;
  note?: string;
}

export async function sendQuoteAsPro(
  pro: ProfessionalProfile,
  lead: Lead,
  input: QuoteInput,
): Promise<Quote> {
  analytics.track('quote_sent', { requestId: lead.requestId });
  if (ENV.isDemo) return demo.sendQuote(pro, lead, input);
  const request = await fb.fbGetRequest(lead.requestId);
  const totals = computeQuoteTotals(input.lines, input.discount, input.taxPct);
  const quote: Quote = {
    id: newId(),
    requestId: lead.requestId,
    proId: pro.uid,
    proName: pro.businessName || pro.displayName,
    proPhotoURL: pro.photoURL,
    customerId: request?.customerId ?? '',
    serviceName: request?.serviceName ?? '',
    lines: input.lines,
    discount: input.discount,
    taxPct: input.taxPct,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    durationHours: input.durationHours,
    proposedSlot: input.slot,
    note: input.note,
    expiresAt: Date.now() + 3 * 86400000,
    status: 'sent',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await fb.fbSendQuote(quote);
  await fb.fbUpdateLead(lead.id, { state: 'quoted' });
  return quote;
}

export function subscribeQuotesForRequest(requestId: string, cb: (q: Quote[]) => void): () => void {
  if (ENV.isDemo) {
    void demo.ready().then(() => cb(demo.quotesForRequest(requestId)));
    return demo.subscribe('quotes', () => cb(demo.quotesForRequest(requestId)));
  }
  return fb.fbSubscribeQuotesForRequest(requestId, cb);
}

export async function getQuote(id: string): Promise<Quote | null> {
  if (ENV.isDemo) {
    await demo.ready();
    return demo.quote(id) ?? null;
  }
  return null; // callers get quotes via request subscription
}

export async function setQuoteStatus(quoteId: string, status: QuoteStatus): Promise<void> {
  if (ENV.isDemo) {
    demo.updateQuote(quoteId, { status });
    return;
  }
  await fb.fbUpdateQuote(quoteId, { status });
}

/** Accept a quote → creates the booking. Production: callable Cloud Function. */
export async function acceptQuote(quoteId: string, customerName: string): Promise<string> {
  analytics.track('quote_accepted', { quoteId });
  if (ENV.isDemo) {
    const booking = await demo.acceptQuote(quoteId, customerName);
    return booking.id;
  }
  const snapQuote = await fb.fbGetQuoteById(quoteId);
  if (!snapQuote) throw new Error('Quote not found');
  const request = await fb.fbGetRequest(snapQuote.requestId);
  await fb.fbUpdateQuote(quoteId, { status: 'accepted' }); // CF creates the booking + notifies both sides
  if (request) await fb.fbUpdateRequest(request.id, { status: 'booked' });
  // booking doc id is minted by the Cloud Function; callers navigate via the
  // bookings subscription (customer lands on the new booking automatically)
  return snapQuote.requestId;
}

