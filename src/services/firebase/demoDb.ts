/**
 * Demo backend — a complete in-memory implementation of the Betegna service
 * layer with persistence (AsyncStorage) and *simulated professional behavior*
 * (matched pros reply in chat, send quotes, propose times, accept from the
 * pro side). This exists so the app is fully runnable with zero credentials;
 * the Firebase adapter (./firebaseClient.ts) implements the same surface for
 * production. UI code never touches this module directly.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppNotification,
  AppUser,
  Availability,
  Booking,
  Conversation,
  FavoriteItem,
  Lead,
  Message,
  NotificationPrefs,
  PaymentRecord,
  ProfessionalProfile,
  Quote,
  QuoteLineItem,
  RequestStatus,
  Review,
  ServiceRequest,
  UserRole,
} from '../../models/types';
import { newId } from '../../utils/id';
import { rankPros } from '../../features/matching/engine';
import { computeQuoteTotals } from '../../features/quotes/quoteMath';
import { cancellationOutcome, isRefundable, refundSplit, releaseFeeSplit, DEFAULT_CANCELLATION_POLICY } from '../../features/payments/refunds';
import { addDaysISO, todayISO } from '../../utils/format';
import { getService } from '../../config/seed/taxonomy';
import { DEMO_PROFESSIONALS } from '../../config/seed/professionals';

const DB_KEY = 'betegna-demo-db-v1';

export interface RequestDraft {
  serviceId: string;
  summaryText: string;
  answers: Record<string, string | number | string[] | boolean | undefined>;
  description?: string;
  location: { subcity: string; city: string; address?: string };
  when: ServiceRequest['when'];
  photos: string[];
}

interface DemoState {
  users: Record<string, AppUser>;
  session: string | null;
  professionals: Record<string, ProfessionalProfile>;
  requests: Record<string, ServiceRequest>;
  quotes: Record<string, Quote>;
  conversations: Record<string, Conversation>;
  messages: Record<string, Message[]>; // by conversationId
  bookings: Record<string, Booking>;
  reviews: Record<string, Review>;
  leads: Record<string, Lead>;
  notifications: Record<string, AppNotification>;
  favorites: Record<string, FavoriteItem>;
  payments: Record<string, PaymentRecord>;
  proLeadsSeeded: boolean;
}

type Listener = () => void;

const DEFAULT_PREFS = (): NotificationPrefs => ({
  channels: { inApp: true, push: true, email: true, sms: false },
  kinds: {
    message: true, request: true, quote: true, booking: true,
    payment: true, review: true, lead: true, system: true,
  },
});

function freshState(): DemoState {
  return {
    users: {},
    session: null,
    professionals: Object.fromEntries(DEMO_PROFESSIONALS.map((p) => [p.uid, { ...p }])),
    requests: {},
    quotes: {},
    conversations: {},
    messages: {},
    bookings: {},
    reviews: {},
    leads: {},
    notifications: {},
    favorites: {},
    payments: {},
    proLeadsSeeded: false,
  };
}

class DemoDb {
  private state: DemoState = freshState();
  private listeners = new Map<string, Set<Listener>>();
  private readyPromise: Promise<void> | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  ready(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = this.load();
    }
    return this.readyPromise;
  }

  private async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        if (parsed && parsed.users) {
          // migrate legacy payment records (pre-provider-architecture schema)
          for (const [id, pay] of Object.entries(parsed.payments ?? {})) {
            const legacy = pay as unknown as Record<string, unknown>;
            if (!('updatedAt' in legacy)) {
              parsed.payments[id] = {
                ...legacy,
                provider: (legacy.provider as string) ?? 'cash',
                method: (legacy.method as string) ?? 'cash',
                initiatedAt: (legacy.initiatedAt as number) ?? (legacy.createdAt as number) ?? Date.now(),
                updatedAt: Date.now(),
              } as PaymentRecord;
            }
          }
          this.state = { ...freshState(), ...parsed };
        }
      } else {
        await this.seedDemoAccount();
      }
    } catch {
      // corrupted storage → start fresh
      this.state = freshState();
    }
  }

  private async seedDemoAccount(): Promise<void> {
    const demoUser: AppUser = {
      uid: 'demo-customer',
      name: 'Dawit Guest',
      email: 'demo@betegna.app',
      phone: '+251911000000',
      roles: ['customer'],
      activeRole: 'customer',
      locale: 'en',
      homeArea: { subcity: 'Bole', city: 'Addis Ababa' },
      emailVerified: true,
      notificationPrefs: DEFAULT_PREFS(),
      createdAt: Date.now() - 30 * 86400000,
    };
    this.state.users[demoUser.uid] = demoUser;
    await this.persist();
  }

  private schedulePersist(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      void this.persist();
    }, 250);
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(DB_KEY, JSON.stringify(this.state));
    } catch {
      /* storage full/blocked — demo continues in memory */
    }
  }

  private resetDemoState(): void {
    const session = this.state.session;
    this.state = freshState();
    this.state.session = session;
    void this.seedDemoAccount();
    this.schedulePersist();
  }

  /* ── pub/sub ── */
  subscribe(key: string, cb: Listener): () => void {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(cb);
    return () => {
      this.listeners.get(key)?.delete(cb);
    };
  }

  private emit(...keys: string[]): void {
    for (const k of keys) this.listeners.get(k)?.forEach((cb) => cb());
    this.schedulePersist();
  }

  /* ── auth ── */
  async signUp(input: { name: string; email: string; password: string; role: UserRole }): Promise<AppUser> {
    await this.ready();
    const email = input.email.toLowerCase().trim();
    if (Object.values(this.state.users).some((u) => u.email === email)) {
      throw new Error('An account with this email already exists');
    }
    const user: AppUser = {
      uid: newId(),
      name: input.name.trim(),
      email,
      phone: undefined,
      roles: [input.role],
      activeRole: input.role,
      locale: 'en',
      homeArea: { subcity: 'Bole', city: 'Addis Ababa' },
      emailVerified: true, // demo: instant
      notificationPrefs: DEFAULT_PREFS(),
      createdAt: Date.now(),
    };
    this.state.users[user.uid] = user;
    this.state.session = user.uid;
    this.emit('auth');
    return user;
  }

  async signIn(email: string, _password: string): Promise<AppUser> {
    await this.ready();
    const e = email.toLowerCase().trim();
    let user = Object.values(this.state.users).find((u) => u.email === e);
    if (!user && e === 'demo@betegna.app') {
      user = this.state.users['demo-customer'];
    }
    if (!user) {
      // demo mode: any credentials create a session (frictionless preview)
      user = await this.signUp({ name: e.split('@')[0] ?? 'Guest', email: e, password: _password, role: 'customer' });
      return user;
    }
    this.state.session = user.uid;
    this.emit('auth');
    return user;
  }

  async signOut(): Promise<void> {
    await this.ready();
    this.state.session = null;
    this.emit('auth');
  }

  currentUid(): string | null {
    return this.state.session;
  }

  currentUser(): AppUser | null {
    const uid = this.state.session;
    return uid ? this.state.users[uid] ?? null : null;
  }

  updateUser(uid: string, patch: Partial<AppUser>): AppUser | null {
    const u = this.state.users[uid];
    if (!u) return null;
    this.state.users[uid] = { ...u, ...patch };
    this.emit('auth');
    return this.state.users[uid] ?? null;
  }

  /* ── professionals ── */
  allPros(): ProfessionalProfile[] {
    return Object.values(this.state.professionals);
  }

  pro(uid: string): ProfessionalProfile | undefined {
    return this.state.professionals[uid];
  }

  ensureUserProProfile(user: AppUser): ProfessionalProfile {
    const existing = this.state.professionals[user.uid];
    if (existing) return existing;
    const wh: Availability['workingHours'] = {};
    for (let d = 0; d <= 6; d++) wh[d] = { enabled: d >= 1 && d <= 6, start: '08:00', end: '18:00' };
    const profile: ProfessionalProfile = {
      uid: user.uid,
      displayName: user.name,
      businessName: `${user.name.split(' ')[0] ?? user.name} Services`,
      about: 'Add your description so customers know who you are and what you do best.',
      categoryIds: ['cleaning'],
      serviceIds: ['house-cleaning', 'deep-cleaning', 'move-out-cleaning'],
      services: [
        { id: newId(), name: 'Home cleaning', price: 650, unit: 'visit' },
        { id: newId(), name: 'Deep cleaning', price: 1500, unit: 'visit' },
      ],
      serviceArea: ['Bole', 'Yeka', 'Kirkos'],
      baseLocation: { subcity: 'Bole', city: 'Addis Ababa' },
      startingPrice: 650,
      priceUnit: 'visit',
      rating: 0,
      reviewCount: 0,
      jobsCompleted: 0,
      yearsExperience: 1,
      responseRatePct: 100,
      medianResponseMinutes: 5,
      completionRatePct: 100,
      verified: false,
      badges: [],
      availability: { workingHours: wh, vacationDates: [], slotDurationMin: 120, bufferMin: 30 },
      portfolio: [],
      credentials: [],
      joinedAt: Date.now(),
    };
    this.state.professionals[user.uid] = profile;
    if (!user.roles.includes('professional')) {
      this.updateUser(user.uid, { roles: [...user.roles, 'professional'] });
    }
    this.emit('professionals');
    return profile;
  }

  updatePro(uid: string, patch: Partial<ProfessionalProfile>): void {
    // upsert: creates the profile when it doesn't exist (guided onboarding
    // activates an account that has no professional entry yet)
    const existing = this.state.professionals[uid];
    this.state.professionals[uid] = existing
      ? { ...existing, ...patch }
      : ({ ...patch, uid } as ProfessionalProfile);
    this.emit('professionals', 'pro-profile:' + uid);
  }

  /* ── notifications ── */
  pushNotification(uid: string, n: Omit<AppNotification, 'id' | 'uid' | 'read' | 'createdAt'>): void {
    const noti: AppNotification = {
      id: newId(),
      uid,
      read: false,
      createdAt: Date.now(),
      ...n,
    };
    this.state.notifications[noti.id] = noti;
    this.emit('notifications:' + uid);
  }

  notificationsFor(uid: string): AppNotification[] {
    return Object.values(this.state.notifications)
      .filter((n) => n.uid === uid)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100);
  }

  markNotificationRead(uid: string, id: string): void {
    const n = this.state.notifications[id];
    if (n && n.uid === uid) {
      this.state.notifications[id] = { ...n, read: true };
      this.emit('notifications:' + uid);
    }
  }

  markAllNotificationsRead(uid: string): void {
    for (const n of Object.values(this.state.notifications)) {
      if (n.uid === uid) this.state.notifications[n.id] = { ...n, read: true };
    }
    this.emit('notifications:' + uid);
  }

  /* ── requests & matching ── */
  requestsFor(uid: string): ServiceRequest[] {
    return Object.values(this.state.requests)
      .filter((r) => r.customerId === uid)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  request(id: string): ServiceRequest | undefined {
    return this.state.requests[id];
  }

  updateRequest(id: string, patch: Partial<ServiceRequest>): void {
    const r = this.state.requests[id];
    if (!r) return;
    this.state.requests[id] = { ...r, ...patch, updatedAt: Date.now() };
    this.emit('requests', 'request:' + id);
  }

  async createRequest(user: AppUser, draft: RequestDraft): Promise<ServiceRequest> {
    await this.ready();
    const svc = getService(draft.serviceId);
    if (!svc) throw new Error('Unknown service');
    const request: ServiceRequest = {
      id: newId(),
      customerId: user.uid,
      customerName: user.name,
      categoryId: svc.categoryId,
      serviceId: svc.id,
      serviceName: svc.name,
      summaryText: draft.summaryText,
      answers: draft.answers,
      description: draft.description,
      location: { ...draft.location },
      when: draft.when,
      photos: draft.photos,
      status: 'matching',
      matchedProIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.state.requests[request.id] = request;
    this.emit('requests');

    // run matching engine over demo supply
    const matches = rankPros(request, this.allPros(), { limit: 4 }).filter((m) => !m.proId.startsWith('demo-'));
    const matched = matches.length ? matches : rankPros(request, this.allPros(), { limit: 3, minScore: 0 });
    request.matchedProIds = matched.map((m) => m.proId);

    // leads for every matched pro (user-as-pro sees theirs if matched)
    for (const m of matched) {
      const lead: Lead = {
        id: newId(),
        requestId: request.id,
        proId: m.proId,
        state: 'new',
        score: m.score,
        seen: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.state.leads[lead.id] = lead;
    }
    this.updateRequest(request.id, { status: 'matched' });
    this.pushNotification(user.uid, {
      kind: 'request',
      title: `${matched.length} professionals matched`,
      body: `We notified ${matched.length} verified professionals for “${svc.name}”. Expect quotes shortly.`,
      deepLink: `betegna://request/${request.id}`,
    });
    this.emit('leads');

    // ── simulated professional behavior ──
    const top = matched.slice(0, 2);
    top.forEach((m, i) => {
      const pro = this.state.professionals[m.proId];
      if (!pro || pro.uid === user.uid) return;
      setTimeout(() => this.simProIntro(pro, request), 5000 + i * 9000);
      setTimeout(() => this.simProQuote(pro, request, m.distanceKm), 13000 + i * 11000);
    });

    return request;
  }

  private simProIntro(pro: ProfessionalProfile, request: ServiceRequest): void {
    const r = this.state.requests[request.id];
    if (!r || r.status === 'cancelled') return;
    const conv = this.ensureConversation(request.customerId, pro.uid, request.id);
    const text = introLine(pro, request);
    this.insertMessage(conv.id, {
      senderId: pro.uid,
      type: 'text',
      text,
    });
    this.markLeadState(pro.uid, request.id, 'contacted');
    this.pushNotification(request.customerId, {
      kind: 'message',
      title: `${pro.displayName} replied`,
      body: text.slice(0, 90),
      deepLink: `betegna://conversation/${conv.id}`,
    });
  }

  private simProQuote(pro: ProfessionalProfile, request: ServiceRequest, distanceKm?: number): void {
    const r = this.state.requests[request.id];
    if (!r || r.status === 'cancelled' || r.status === 'booked') return;
    if (this.quotesForRequest(request.id).some((q) => q.proId === pro.uid)) return;
    const svc = getService(request.serviceId);
    const base = svc ? svc.fromPrice : 800;
    const factor = 0.85 + Math.min(0.6, pro.rating / 10) + (distanceKm != null && distanceKm > 10 ? 0.15 : 0);
    const labor = Math.round((base * factor) / 50) * 50;
    const materials = answersMaterial(request) > 0 ? answersMaterial(request) : Math.round((base * 0.25) / 50) * 50;
    const lines: QuoteLineItem[] = [
      { label: `Labor (${request.serviceName})`, kind: 'labor', amount: labor },
      ...(materials > 0 ? [{ label: 'Materials & supplies', kind: 'material' as const, amount: materials }] : []),
    ];
    const totals = computeQuoteTotals(lines, 0, 15);
    const date = r.when.preferredDate ?? addDaysISO(1);
    const slotStart = r.when.preferredTime?.match(/^\d{2}:\d{2}$/) ? r.when.preferredTime : '10:00';
    const slot = { date, start: slotStart, end: addHours(slotStart, 2) };
    const quote: Quote = {
      id: newId(),
      requestId: r.id,
      proId: pro.uid,
      proName: pro.businessName || pro.displayName,
      proPhotoURL: pro.photoURL,
      customerId: r.customerId,
      serviceName: r.serviceName,
      lines,
      discount: 0,
      taxPct: 15,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      durationHours: 3,
      proposedSlot: slot,
      note: `Happy to help! I can bring all materials. The quote covers everything including transport.`,
      expiresAt: Date.now() + 3 * 86400000,
      status: 'sent',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.state.quotes[quote.id] = quote;

    const conv = this.ensureConversation(r.customerId, pro.uid, r.id);
    conv.quoteId = quote.id;
    this.insertMessage(conv.id, { senderId: pro.uid, type: 'quote', payload: { quoteId: quote.id, total: quote.total, summary: `${lines.map((l) => l.label).join(' + ')}`, status: 'sent' } });
    this.insertMessage(conv.id, {
      senderId: pro.uid,
      type: 'appointment',
      payload: { date: slot.date, start: slot.start, end: slot.end, status: 'proposed' },
      text: `I propose ${slot.date} at ${slot.start}. Does that work for you?`,
    });

    this.markLeadState(pro.uid, r.id, 'quoted');
    if (r.status === 'matched') this.updateRequest(r.id, { status: 'quote_received' });
    this.pushNotification(r.customerId, {
      kind: 'quote',
      title: `New quote from ${pro.businessName || pro.displayName}`,
      body: `${request.serviceName} — total ${quote.total.toLocaleString()} ETB. Tap to review.`,
      deepLink: `betegna://request/${r.id}`,
    });
    this.emit('quotes');
  }

  /* ── quotes ── */
  quotesForRequest(requestId: string): Quote[] {
    return Object.values(this.state.quotes)
      .filter((q) => q.requestId === requestId)
      .sort((a, b) => a.total - b.total);
  }

  quote(id: string): Quote | undefined {
    return this.state.quotes[id];
  }

  updateQuote(id: string, patch: Partial<Quote>): void {
    const q = this.state.quotes[id];
    if (!q) return;
    this.state.quotes[id] = { ...q, ...patch, updatedAt: Date.now() };
    this.emit('quotes', 'quotes:' + q.requestId, 'request:' + q.requestId);
  }

  /** Pro (incl. the demo user acting as pro) sends a quote on a lead — idempotent per (request, pro). */
  async sendQuote(pro: ProfessionalProfile, lead: Lead, input: {
    lines: QuoteLineItem[]; discount: number; taxPct: number; durationHours?: number;
    slot?: { date: string; start: string; end: string }; note?: string;
  }): Promise<Quote> {
    await this.ready();
    const r = this.state.requests[lead.requestId];
    if (!r) throw new Error('Request not found');
    const totals = computeQuoteTotals(input.lines, input.discount, input.taxPct);
    // update-in-place when this pro already quoted — never duplicate
    const existing = Object.values(this.state.quotes).find(
      (q) => q.requestId === r.id && q.proId === pro.uid,
    );
    if (existing && existing.status === 'accepted') throw new Error('Quote already accepted by the customer');
    const quote: Quote = {
      id: existing?.id ?? newId(),
      requestId: r.id,
      proId: pro.uid,
      proName: pro.businessName || pro.displayName,
      proPhotoURL: pro.photoURL,
      customerId: r.customerId,
      serviceName: r.serviceName,
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
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    this.state.quotes[quote.id] = quote;
    this.markLeadState(pro.uid, r.id, 'quoted');
    if (r.status === 'matched') this.updateRequest(r.id, { status: 'quote_received' });

    if (this.state.users[r.customerId]) {
      // real (demo-account) customer
      const conv = this.ensureConversation(r.customerId, pro.uid, r.id);
      conv.quoteId = quote.id;
      this.insertMessage(conv.id, { senderId: pro.uid, type: 'quote', payload: { quoteId: quote.id, total: quote.total, summary: quote.lines.map((l) => l.label).join(' + '), status: 'sent' } });
      this.pushNotification(r.customerId, {
        kind: 'quote',
        title: `New quote from ${quote.proName}`,
        body: `${r.serviceName} — ${quote.total.toLocaleString()} ETB`,
        deepLink: `betegna://request/${r.id}`,
      });
    } else {
      // simulated customer accepts after a short delay → full loop for the pro
      const conv = this.ensureConversation(r.customerId, pro.uid, r.id);
      this.insertMessage(conv.id, { senderId: r.customerId, type: 'text', text: 'Thank you for the quick quote! Looks good to me.' });
      setTimeout(() => {
        void this.acceptQuote(quote.id, r.customerName);
      }, 9000);
    }
    this.emit('quotes');
    return quote;
  }

  async acceptQuote(quoteId: string, byCustomerName: string): Promise<Booking> {
    const quote = this.state.quotes[quoteId];
    if (!quote) throw new Error('Quote not found');
    const r = this.state.requests[quote.requestId];
    this.updateQuote(quoteId, { status: 'accepted' });
    for (const other of this.quotesForRequest(quote.requestId)) {
      if (other.id !== quoteId && other.status === 'sent') this.updateQuote(other.id, { status: 'declined' });
    }
    const booking: Booking = {
      id: newId(),
      requestId: quote.requestId,
      quoteId: quote.id,
      customerId: quote.customerId,
      customerName: r?.customerName ?? byCustomerName,
      proId: quote.proId,
      proName: quote.proName,
      proPhotoURL: quote.proPhotoURL,
      serviceId: r?.serviceId ?? '',
      serviceName: quote.serviceName,
      scheduledAt: quote.proposedSlot,
      address: r?.location.address,
      subcity: r?.location.subcity,
      total: quote.total,
      status: 'confirmed',
      timeline: [
        { at: Date.now(), kind: 'booking_confirmed', label: 'Booking confirmed' },
      ],
      reviewed: false,
      paid: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.state.bookings[booking.id] = booking;
    if (r) {
      this.updateRequest(r.id, { status: 'booked' });
    }
    this.markLeadState(quote.proId, quote.requestId, 'won');

    const conv = this.ensureConversation(quote.customerId, quote.proId, quote.requestId);
    conv.bookingId = booking.id;
    this.insertMessage(conv.id, { senderId: 'system', type: 'booking', payload: { bookingId: booking.id, status: 'confirmed' } });

    this.pushNotification(quote.customerId, {
      kind: 'booking',
      title: 'Booking confirmed',
      body: `${quote.proName} • ${quote.serviceName} — ${quote.proposedSlot ? `${quote.proposedSlot.date} ${quote.proposedSlot.start}` : 'schedule TBD'}`,
      deepLink: `betegna://booking/${booking.id}`,
    });
    this.pushNotification(quote.proId, {
      kind: 'booking',
      title: 'Quote accepted 🎉',
      body: `${r?.customerName ?? 'Customer'} accepted your quote for ${quote.serviceName}.`,
      deepLink: `betegna://booking/${booking.id}`,
    });
    this.emit('bookings', 'request:' + quote.requestId);
    return booking;
  }

  /* ── bookings ── */
  bookingsForCustomer(uid: string): Booking[] {
    return Object.values(this.state.bookings)
      .filter((b) => b.customerId === uid)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  bookingsForPro(uid: string): Booking[] {
    return Object.values(this.state.bookings)
      .filter((b) => b.proId === uid)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  booking(id: string): Booking | undefined {
    return this.state.bookings[id];
  }

  updateBooking(id: string, patch: Partial<Booking>, event?: { kind: string; label: string }): Booking | undefined {
    const b = this.state.bookings[id];
    if (!b) return undefined;
    const timeline = event ? [...b.timeline, { at: Date.now(), kind: event.kind, label: event.label }] : b.timeline;
    this.state.bookings[id] = { ...b, ...patch, timeline, updatedAt: Date.now() };
    const updated = this.state.bookings[id]!;
    this.emit('bookings', 'booking:' + id);
    if (patch.status === 'cancelled') {
      this.settleCancellation(updated);
    }
    if (event) {
      this.pushNotification(updated.customerId, { kind: 'booking', title: 'Booking update', body: event.label, deepLink: `betegna://booking/${id}` });
      this.pushNotification(updated.proId, { kind: 'booking', title: 'Booking update', body: event.label, deepLink: `betegna://booking/${id}` });
    }
    if (patch.status === 'completed') {
      this.onBookingCompleted(updated);
    }
    return updated;
  }

  /** Cancellation settlement: refund escrowed funds per policy (cash needs no refund). */
  private settleCancellation(b: Booking): void {
    const outcome = cancellationOutcome(b);
    for (const p of this.paymentsFor(b.customerId)) {
      if (p.bookingId !== b.id || !isRefundable(p)) continue;
      const { refundAmount, proAmount } = refundSplit(p.amount, outcome);
      this.updatePayment(p.id, { status: 'refunded', refundAmount, proAmount, updatedAt: Date.now() });
      if (proAmount > 0) {
        const fee = releaseFeeSplit(proAmount);
        const proPortion: PaymentRecord = {
          ...p,
          id: `${p.id}_latefee`,
          amount: proAmount,
          status: 'released',
          platformFee: fee.platformFee,
          proNet: fee.proNet,
          releasedAt: Date.now(),
          refundAmount: undefined,
          proAmount: undefined,
        };
        this.state.payments[proPortion.id] = proPortion;
      }
      this.pushNotification(b.customerId, {
        kind: 'payment',
        title: refundAmount > 0 ? 'Refund issued' : 'Payment settled to professional',
        body:
          refundAmount > 0
            ? `${refundAmount.toLocaleString()} ETB refunded to Telebirr. ${outcome.label}.`
            : outcome.label,
        deepLink: `betegna://booking/${b.id}`,
      });
      this.emit('payments');
    }
  }

  private onBookingCompleted(b: Booking): void {
    const pro = this.state.professionals[b.proId];
    if (pro) this.updatePro(pro.uid, { jobsCompleted: pro.jobsCompleted + 1 });
    const r = this.state.requests[b.requestId];
    if (r) this.updateRequest(r.id, { status: 'completed' });
    // digital payments held in escrow are released on completion; cash waits for confirmation
    for (const p of this.paymentsFor(b.customerId)) {
      if (p.bookingId !== b.id) continue;
      if (p.method === 'digital' && p.status === 'held') {
        this.updatePayment(p.id, { status: 'released', releasedAt: Date.now() });
      }
    }
    // simulated bookings (fake customers/pros) settle cash automatically
    if (!this.state.users[b.customerId] || !this.state.users[b.proId] || b.proId.startsWith('pro-')) {
      const cash = this.paymentsFor(b.customerId).find((p) => p.bookingId === b.id && p.method === 'cash');
      if (cash) this.confirmPaymentCollected(cash.id, b.proId);
    }
    // simulated pros confirm cash a few seconds after completion (demo realism)
    if (b.proId.startsWith('pro-') && this.state.users[b.customerId]) {
      const cash = this.paymentsFor(b.customerId).find((p) => p.bookingId === b.id && p.method === 'cash' && p.status === 'pending');
      if (cash) setTimeout(() => this.confirmPaymentCollected(cash.id, b.proId), 9000);
    }
    this.pushNotification(b.customerId, {
      kind: 'payment',
      title: 'Job completed',
      body: `${b.proName} marked the job complete. ${b.paid ? 'Payment settled.' : 'Complete your payment & leave a review.'}`,
      deepLink: `betegna://booking/${b.id}`,
    });
    this.emit('payments');
  }

  /* ── payments (provider-agnostic; demo simulates the Telebirr adapter) ── */

  initiatePayment(customerUid: string, bookingId: string, providerId: string): PaymentRecord {
    const b = this.state.bookings[bookingId];
    if (!b) throw new Error('Booking not found');
    if (b.paid) throw new Error('Booking already paid');
    void customerUid;
    const now = Date.now();
    const base: PaymentRecord = {
      id: `pay_${bookingId}_${providerId}_${now}`,
      bookingId,
      requestId: b.requestId,
      payerUid: b.customerId,
      payeeUid: b.proId,
      amount: b.total,
      currency: 'ETB',
      provider: providerId,
      method: providerId === 'cash' ? 'cash' : 'digital',
      status: 'pending',
      initiatedAt: now,
      updatedAt: now,
    };
    this.state.payments[base.id] = base;

    if (providerId === 'cash') {
      this.pushNotification(b.proId, {
        kind: 'payment',
        title: 'Customer will pay by cash',
        body: `${b.serviceName} · ${b.total.toLocaleString()} ETB — confirm collection in the app after the job.`,
        deepLink: `betegna://booking/${b.id}`,
      });
    } else {
      // simulate the Telebirr adapter: redirect → processing → provider confirms → held (escrow)
      const processing: PaymentRecord = { ...base, status: 'processing', providerRef: `TB${Math.floor(Math.random() * 9e9)}`, updatedAt: Date.now() };
      this.state.payments[base.id] = processing;
      this.emit('payments');
      setTimeout(() => {
        const current = this.state.payments[base.id];
        if (!current || current.status !== 'processing') return;
        this.updatePayment(base.id, { status: 'held' });
        this.pushNotification(b.customerId, {
          kind: 'payment',
          title: 'Telebirr payment received',
          body: `${b.total.toLocaleString()} ETB is held securely. It is released to ${b.proName} when the job is done.`,
          deepLink: `betegna://booking/${b.id}`,
        });
      }, 6000);
    }
    this.emit('payments');
    return this.state.payments[base.id] ?? base;
  }

  /** Pro confirms a cash collection (or system settles simulated bookings). */
  confirmPaymentCollected(paymentId: string, byUid: string): void {
    const p = this.state.payments[paymentId];
    if (!p || p.status === 'released') return;
    this.updatePayment(paymentId, { status: 'released', confirmedBy: byUid, releasedAt: Date.now() });
  }

  updatePayment(id: string, patch: Partial<PaymentRecord>): void {
    const p = this.state.payments[id];
    if (!p) return;
    const next: PaymentRecord = { ...p, ...patch, updatedAt: Date.now() };
    if (next.status === 'released' && next.platformFee === undefined) {
      // record the fee split (monetization is configuration, not magic numbers)
      const fee = releaseFeeSplit(next.amount, DEFAULT_CANCELLATION_POLICY);
      next.platformFee = fee.platformFee;
      next.proNet = fee.proNet;
      next.releasedAt = Date.now();
    }
    this.state.payments[id] = next;
    if (next.status === 'held') {
      // escrow captured AFTER the job was already completed → release immediately
      const b = this.state.bookings[p.bookingId];
      if (b && b.status === 'completed') {
        this.state.payments[id] = next; // persist held first
        this.updatePayment(id, { status: 'released' });
        return;
      }
    }
    if (next.status === 'released') {
      const b = this.state.bookings[p.bookingId];
      if (b && !b.paid) this.updateBooking(b.id, { paid: true });
      this.pushNotification(p.payeeUid, {
        kind: 'payment',
        title: 'Payment received 🎉',
        body: `${(next.proNet ?? next.amount).toLocaleString()} ETB is now yours${next.platformFee ? ` (after ${next.platformFee.toLocaleString()} ETB platform fee)` : ''}.`,
        deepLink: `betegna://booking/${p.bookingId}`,
      });
    }
    this.emit('payments', 'payment:' + id);
  }

  /* ── reviews ── */
  reviewsForPro(uid: string): Review[] {
    const list = Object.values(this.state.reviews)
      .filter((r) => r.proId === uid)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);
    // lazily materialize a few sample reviews for seeded marketplace pros so
    // profiles show real content (only runs once, then persisted)
    if (!list.length) {
      const pro = DEMO_PROFESSIONALS.find((p) => p.uid === uid);
      if (pro) {
        const samples = SAMPLE_REVIEWS.map((s, i) => ({
          id: `seedrev_${uid}_${i}`,
          bookingId: `seedbk_${uid}_${i}`,
          requestId: '',
          customerId: `seedcust_${i}`,
          customerName: s.name,
          proId: uid,
          overall: s.overall,
          quality: s.overall,
          communication: s.overall,
          professionalism: s.overall,
          value: s.overall,
          punctuality: s.overall,
          text: s.text,
          createdAt: Date.now() - (i + 1) * 6 * 86400000,
        })) as Review[];
        for (const rv of samples) this.state.reviews[rv.id] = rv;
        this.schedulePersist();
        return samples;
      }
    }
    return list;
  }

  async addReview(input: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    await this.ready();
    const review: Review = { ...input, id: newId(), createdAt: Date.now() };
    this.state.reviews[review.id] = review;
    const pro = this.state.professionals[review.proId];
    if (pro) {
      const PRIOR_RATING = 4.2;
      const count = pro.reviewCount;
      const blended = (pro.rating * count + review.overall + PRIOR_RATING * 10) / (count + 1 + 10);
      this.updatePro(pro.uid, { rating: Math.round(blended * 10) / 10, reviewCount: count + 1 });
    }
    const b = this.state.bookings[review.bookingId];
    if (b) this.updateBooking(b.id, { reviewed: true });
    const r = this.state.requests[review.requestId];
    if (r) this.updateRequest(r.id, { status: 'completed' });
    this.pushNotification(review.proId, {
      kind: 'review',
      title: `New ${review.overall}★ review`,
      body: review.text?.slice(0, 80) ?? 'A customer reviewed your work.',
      deepLink: `betegna://professional/${review.proId}`,
    });
    this.emit('reviews');
    return review;
  }

  /* ── favorites ── */
  favoritesFor(uid: string): FavoriteItem[] {
    return Object.values(this.state.favorites).filter((f) => f.customerId === uid);
  }

  isFavorite(uid: string, proId: string): boolean {
    return this.favoritesFor(uid).some((f) => f.proId === proId);
  }

  toggleFavorite(uid: string, proId: string): boolean {
    const existing = this.favoritesFor(uid).find((f) => f.proId === proId);
    if (existing) {
      delete this.state.favorites[existing.id];
      this.emit('favorites:' + uid);
      return false;
    }
    const fav: FavoriteItem = { id: newId(), customerId: uid, proId, createdAt: Date.now() };
    this.state.favorites[fav.id] = fav;
    this.emit('favorites:' + uid);
    return true;
  }

  /* ── chat ── */
  ensureConversation(customerId: string, proId: string, requestId?: string): Conversation {
    const existing = Object.values(this.state.conversations).find(
      (c) => c.customerId === customerId && c.proId === proId && (!requestId || c.requestId === requestId),
    );
    if (existing) return existing;
    const customer = this.state.users[customerId];
    const pro = this.state.professionals[proId];
    const conv: Conversation = {
      id: newId(),
      customerId,
      proId,
      participantNames: {
        [customerId]: customer?.name ?? 'Customer',
        [proId]: pro?.businessName ?? pro?.displayName ?? 'Professional',
      },
      participantPhotos: pro?.photoURL ? { [proId]: pro.photoURL } : undefined,
      requestId,
      unread: { [customerId]: 0, [proId]: 0 },
      updatedAt: Date.now(),
    };
    this.state.conversations[conv.id] = conv;
    this.emit('conversations');
    return conv;
  }

  conversationsFor(uid: string): Conversation[] {
    return Object.values(this.state.conversations)
      .filter((c) => c.customerId === uid || c.proId === uid)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  conversation(id: string): Conversation | undefined {
    return this.state.conversations[id];
  }

  messagesFor(conversationId: string, limit = 50, before?: number): Message[] {
    const all = this.state.messages[conversationId] ?? [];
    const sorted = [...all].sort((a, b) => a.createdAt - b.createdAt);
    if (!before) return sorted.slice(-limit);
    const idx = sorted.findIndex((m) => m.createdAt >= before);
    return idx < 0 ? sorted.slice(-limit) : sorted.slice(Math.max(0, idx - limit), idx);
  }

  insertMessage(conversationId: string, msg: Omit<Message, 'id' | 'conversationId' | 'createdAt' | 'readBy'> & { createdAt?: number }): Message {
    const full: Message = {
      id: newId(),
      conversationId,
      createdAt: Date.now(),
      readBy: [msg.senderId],
      ...msg,
    };
    const list = this.state.messages[conversationId] ?? [];
    list.push(full);
    this.state.messages[conversationId] = list;
    const conv = this.state.conversations[conversationId];
    if (conv) {
      let text = msg.text ?? msg.type;
      if (!msg.text && msg.type === 'quote' && msg.payload) {
        const pay = msg.payload as { total?: number };
        text = `📸 Quote · ${(pay.total ?? 0).toLocaleString()} ETB`;
      } else if (!msg.text && msg.type === 'appointment' && msg.payload) {
        const pay = msg.payload as { date?: string; start?: string };
        text = `📅 Proposed ${pay.date ?? ''} ${pay.start ?? ''}`.trim();
      }
      const otherId = msg.senderId === conv.customerId ? conv.proId : conv.customerId;
      const isSystem = msg.senderId === 'system';
      this.state.conversations[conversationId] = {
        ...conv,
        lastMessage: { text, at: full.createdAt, senderId: msg.senderId },
        unread: isSystem ? conv.unread : { ...conv.unread, [otherId]: (conv.unread[otherId] ?? 0) + 1 },
        updatedAt: full.createdAt,
      };
    }
    this.emit('messages:' + conversationId, 'conversations');
    return full;
  }

  markConversationRead(conversationId: string, uid: string): void {
    const conv = this.state.conversations[conversationId];
    if (!conv) return;
    const hasUnreadCount = (conv.unread[uid] ?? 0) > 0;
    const msgs = this.state.messages[conversationId] ?? [];
    const unreadMsgs = msgs.filter((m) => !m.readBy.includes(uid));
    // Guard: emitting when nothing changed would re-trigger listeners that call
    // this method again → infinite synchronous recursion (stack overflow).
    if (!hasUnreadCount && unreadMsgs.length === 0) return;
    this.state.conversations[conversationId] = { ...conv, unread: { ...conv.unread, [uid]: 0 } };
    for (const m of unreadMsgs) m.readBy.push(uid);
    this.emit('conversations', 'messages:' + conversationId);
  }

  setTyping(conversationId: string, uid: string, typing: boolean): void {
    const conv = this.state.conversations[conversationId];
    if (!conv) return;
    this.state.conversations[conversationId] = { ...conv, typing: { ...conv.typing, [uid]: typing } };
    this.emit('conversations', 'messages:' + conversationId);
  }

  /* ── leads (professional side) ── */
  leadsForPro(uid: string): Lead[] {
    return Object.values(this.state.leads)
      .filter((l) => l.proId === uid)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  markLeadState(proId: string, requestId: string, state: Lead['state']): void {
    const lead = Object.values(this.state.leads).find((l) => l.proId === proId && l.requestId === requestId);
    if (lead) {
      this.state.leads[lead.id] = { ...lead, state, seen: true, updatedAt: Date.now() };
      this.emit('leads');
    }
  }

  updateLead(leadId: string, patch: Partial<Lead>): void {
    const l = this.state.leads[leadId];
    if (!l) return;
    this.state.leads[leadId] = { ...l, ...patch, updatedAt: Date.now() };
    this.emit('leads');
  }

  /** Seed demo customer requests as leads for a first-time professional. */
  seedLeadsForUserPro(user: AppUser): void {
    if (this.state.proLeadsSeeded) return;
    this.state.proLeadsSeeded = true;
    const seeds: { name: string; serviceId: string; subcity: string; summary: string; when: ServiceRequest['when'] }[] = [
      {
        name: 'Liya Worku', serviceId: 'house-cleaning', subcity: 'Bole',
        summary: 'Need a reliable cleaner for our 2-bedroom apartment — starting this week, ideally recurring.',
        when: { urgency: 'this_week', frequency: 'weekly', preferredDate: addDaysISO(2), preferredTime: 'morning' },
      },
      {
        name: 'Mikias Tesfaye', serviceId: 'deep-cleaning', subcity: 'Yeka',
        summary: 'Deep clean before my parents visit. 3 bedrooms, 2 bathrooms, kitchen needs real attention.',
        when: { urgency: 'tomorrow', frequency: 'one_time', preferredDate: addDaysISO(1), preferredTime: 'afternoon' },
      },
      {
        name: 'Sara Alemayehu', serviceId: 'move-out-cleaning', subcity: 'Kirkos',
        summary: 'Handing over our rental — apartment will be empty, needs full move-out clean.',
        when: { urgency: 'flexible', frequency: 'one_time', preferredDate: addDaysISO(5), preferredTime: 'morning' },
      },
    ];
    for (const s of seeds) {
      const svc = getService(s.serviceId);
      if (!svc) continue;
      const customerId = 'seed-' + s.name.split(' ')[0]!.toLowerCase();
      const request: ServiceRequest = {
        id: newId(),
        customerId,
        customerName: s.name,
        categoryId: svc.categoryId,
        serviceId: svc.id,
        serviceName: svc.name,
        summaryText: s.summary,
        answers: {},
        location: { subcity: s.subcity, city: 'Addis Ababa' },
        when: s.when,
        photos: [],
        status: 'matched',
        matchedProIds: [user.uid],
        createdAt: Date.now() - Math.round(Math.random() * 3 * 3600_000),
        updatedAt: Date.now(),
      };
      this.state.requests[request.id] = request;
      const lead: Lead = {
        id: newId(), requestId: request.id, proId: user.uid, state: 'new',
        score: 70 + Math.round(Math.random() * 20), seen: false,
        createdAt: request.createdAt, updatedAt: request.createdAt,
      };
      this.state.leads[lead.id] = lead;
      const conv = this.ensureConversation(customerId, user.uid, request.id);
      conv.participantNames[customerId] = s.name;
      this.insertMessage(conv.id, {
        senderId: customerId,
        type: 'text',
        text: `Hi! ${s.summary} Could you send me a quote?`,
        createdAt: request.createdAt + 60_000,
      });
    }
    this.pushNotification(user.uid, {
      kind: 'lead',
      title: '3 new leads matched to you',
      body: 'New requests match your services. Respond fast to win the job.',
      deepLink: 'betegna://leads',
    });
    this.emit('leads', 'conversations', 'requests');
  }

  /* ── customer message → simulated pro reply ── */
  maybeAutoReply(conversationId: string, senderId: string, text: string): void {
    const conv = this.state.conversations[conversationId];
    if (!conv) return;
    const otherId = senderId === conv.customerId ? conv.proId : conv.customerId;
    const otherIsPro = otherId === conv.proId;
    if (!otherIsPro) return; // customers aren't simulated for pro-initiated messages
    const pro = this.state.professionals[otherId];
    if (!pro || pro.uid === senderId) return;

    setTimeout(() => this.setTyping(conversationId, otherId, true), 1200);
    setTimeout(() => {
      this.setTyping(conversationId, otherId, false);
      this.insertMessage(conversationId, { senderId: otherId, type: 'text', text: autoReplyLine(text, conv) });
      this.pushNotification(senderId, {
        kind: 'message',
        title: `${pro.businessName || pro.displayName} replied`,
        body: text.slice(0, 60),
        deepLink: `betegna://conversation/${conversationId}`,
      });
    }, 3400);
  }

  /* ── payments/analytics surface ── */
  paymentsFor(uid: string): PaymentRecord[] {
    return Object.values(this.state.payments)
      .filter((p) => p.payeeUid === uid || p.payerUid === uid)
      .sort((a, b) => (b.updatedAt ?? b.initiatedAt ?? 0) - (a.updatedAt ?? a.initiatedAt ?? 0));
  }

  requestStatusFlowDemo(): RequestStatus[] {
    return ['submitted', 'matching', 'matched', 'quote_received', 'pro_selected', 'booked', 'in_progress', 'completed'];
  }
}

/* ── simulated intelligence helpers ── */

function introLine(pro: ProfessionalProfile, r: ServiceRequest): string {
  const first = r.customerName.split(' ')[0] ?? 'there';
  const lines = [
    `Hi ${first}! I saw your ${r.serviceName.toLowerCase()} request — I can definitely help. A couple of quick questions and I'll send you an exact quote.`,
    `Hello ${first}! ${pro.businessName} here. We work in ${r.location.subcity} regularly. Sending you a detailed quote in a minute.`,
    `Hi ${first}, thanks for the request! I've done many ${r.serviceName.toLowerCase()} jobs around ${r.location.subcity}. Quote coming right up.`,
  ];
  return lines[Math.floor(Math.random() * lines.length)] ?? lines[0]!;
}

function answersMaterial(r: ServiceRequest): number {
  const a = r.answers;
  for (const key of Object.keys(a)) {
    if (key.includes('size') || key === 'approx_size') {
      const sqm = Number(a[key]);
      if (!isNaN(sqm) && sqm > 0) return Math.round(sqm * 8);
    }
  }
  return 0;
}

function autoReplyLine(customerText: string, conv: Conversation): string {
  const t = customerText.toLowerCase();
  if (/(price|cost|how much|expensive|ዋጋ|ስንት)/.test(t)) {
    return 'Great question — the quote I sent covers labor, materials and transport, no hidden fees. If your needs change, I can update it anytime.';
  }
  if (/(when|time|date|tomorrow|today|schedule|መቼ|ሰዓት)/.test(t)) {
    return 'I can be flexible — the time in my quote works well for me, but tell me what suits you and I will adjust.';
  }
  if (/(thank|thanks|አመሰግናለሁ|ሰላም)/.test(t)) {
    return 'You are most welcome! Message me here anytime. 🙏';
  }
  if (/(where|area|location|address|የት)/.test(t)) {
    return `No problem — I know ${'the area'} well. You can share the exact address once we confirm the booking; it stays private until then.`;
  }
  const fallback = [
    'Got it, thanks! I will note that down for the job.',
    'Understood — that is no problem at all.',
    'Perfect, that works for me. Anything else I should know before the visit?',
    'Noted! I will come prepared for exactly that.',
  ];
  void conv;
  return fallback[Math.floor(Math.random() * fallback.length)] ?? fallback[0]!;
}

function addHours(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h ?? 0) + hours;
  return `${String(total).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`;
}

const SAMPLE_REVIEWS: { name: string; overall: number; text: string }[] = [
  { name: 'Hanna M.', overall: 5, text: 'Arrived on time, did excellent work and the price was exactly as quoted. Highly recommended!' },
  { name: 'Yonas T.', overall: 5, text: 'Very professional and communicative. Everything was handled through the app — smooth experience.' },
  { name: 'Bethlehem A.', overall: 4, text: 'Good quality work overall. Took a bit longer than expected but the result was worth it.' },
];

export const demo = new DemoDb();
export const DEMO_TODAY = todayISO;
